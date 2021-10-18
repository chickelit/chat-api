import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import { generateToken, request, sendMessages } from "../utils";
import faker from "faker";
import { GroupFactory } from "Database/factories/GroupFactory";
import { UserFactory } from "Database/factories/UserFactory";

test.group("/groups", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[store] - should be able to create a group", async (assert) => {
    const { user, token } = await generateToken();

    const { body } = await request
      .post("/groups")
      .send({
        title: faker.lorem.words(3)
      })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const group = await Database.query()
      .from("groups")
      .where({ id: body.id })
      .first();

    assert.deepEqual(user.id, group.user_id);
    assert.deepEqual(body.title, group.title);

    const isMember = await Database.query()
      .from("group_members")
      .where({ user_id: user.id, group_id: group.id })
      .first();

    assert.exists(isMember);
  });

  test("[update] - should be able to update a group", async (assert) => {
    const { user, token } = await generateToken();
    const newTitle = faker.lorem.words(2);

    const group = await GroupFactory.merge({ userId: user.id }).create();

    await request
      .put("/groups")
      .send({ groupId: group.id, title: newTitle })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const findGroup = await Database.query()
      .from("groups")
      .where({ id: group.id })
      .first();

    assert.deepEqual(newTitle, findGroup.title);
  });

  test("[update] - should fail when trying to update another person's group", async (assert) => {
    const { token } = await generateToken();
    const newTitle = faker.lorem.words(3);

    const user = await UserFactory.create();
    const group = await GroupFactory.merge({ userId: user.id }).create();

    await request
      .put("/groups")
      .send({ groupId: group.id, title: newTitle })
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const findGroup = await Database.query()
      .from("groups")
      .where({ id: group.id })
      .first();

    assert.notEqual(newTitle, findGroup.title);
  });

  test("[destroy] - should be able to delete a group", async (assert) => {
    const { user, token } = await generateToken();

    const group = await GroupFactory.merge({ userId: user.id }).create();

    await request
      .delete(`/groups/${group.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const findGroup = await Database.query()
      .from("groups")
      .where({ id: group.id })
      .first();

    assert.isNull(findGroup);
  });

  test("[destroy] - should fail when trying do delete another person's group", async (assert) => {
    const { token } = await generateToken();
    const { user } = await generateToken();

    const group = await GroupFactory.merge({ userId: user.id }).create();

    await request
      .delete(`/groups/${group.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const findGroup = await Database.query()
      .from("groups")
      .where({ id: group.id })
      .first();

    assert.exists(findGroup);
  });

  test("[index] - should be able to list authenticated user's groups", async (assert) => {
    const { user, token } = await generateToken();

    const groups = await Promise.all(
      Array(10)
        .fill(false)
        .map(async () => {
          const { body } = await request
            .post("/groups")
            .send({
              title: faker.lorem.words(2)
            })
            .set("authorization", `bearer ${token}`)
            .expect(200);

          return body;
        })
    );

    await Promise.all(
      groups.map(async (group) => {
        await sendMessages(token, 10, undefined, group.id);
      })
    );

    const { body } = await request
      .get("/groups?page=1&perPage=20")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.meta);
    assert.exists(body.data);
    assert.equal(body.meta.total, groups.length);

    await Promise.all(
      body.data.map(async (group) => {
        const latestMessage = await Database.query()
          .from("messages")
          .where({ group_id: group.id })
          .orderBy("created_at", "desc")
          .first();

        assert.equal(group.latestMessage.id, latestMessage.id);
        assert.equal(group.latestMessage.userId, latestMessage.user_id);
        assert.equal(group.latestMessage.groupId, latestMessage.group_id);
        assert.equal(group.latestMessage.content, latestMessage.content);
      })
    );

    groups.forEach(async (group) => {
      const memberships = await Database.query()
        .from("group_members")
        .where({ user_id: user.id });

      const isValid = memberships.some(
        (membership) => membership.group_id === group.id
      );

      assert.isTrue(isValid);
    });
  });

  test("[show] - should be able to show an authenticated user's group", async (assert) => {
    const { user, token } = await generateToken();

    const { body: group } = await request
      .post("/groups")
      .send({
        title: faker.lorem.words(2)
      })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const { body } = await request
      .get(`/groups/${group.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.id);
    assert.exists(body.userId);
    assert.exists(body.title);

    const isMember = await Database.query()
      .from("group_members")
      .where({ user_id: user.id, group_id: group.id })
      .first();

    assert.exists(isMember);
  });

  test("[show] - should fail when trying to show a group and you are not member of it", async () => {
    const { token } = await generateToken();
    const { token: userToken } = await generateToken();

    const { body: group } = await request
      .post("/groups")
      .send({
        title: faker.lorem.words(2)
      })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await request
      .get(`/groups/${group.id}`)
      .set("authorization", `bearer ${userToken}`)
      .expect(404);
  });
});
