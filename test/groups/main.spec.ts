import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import { generateGroups, generateToken, request } from "../utils";
import faker from "faker";
import { GroupFactory } from "Database/factories/GroupFactory";
import { UserFactory } from "Database/factories/UserFactory";
import { Group } from "App/Models";

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
        title: faker.lorem.words(2)
      })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const group = await Group.findOrFail(body.id);

    assert.deepEqual(user.id, group.userId);
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

    const findGroup = await Group.findOrFail(group.id);

    assert.deepEqual(newTitle, findGroup.title);
  });

  test("[update] - should fail when trying to update another person's group", async (assert) => {
    const { token } = await generateToken();
    const newTitle = faker.lorem.words(2);

    const user = await UserFactory.create();
    const group = await GroupFactory.merge({ userId: user.id }).create();

    await request
      .put("/groups")
      .send({ groupId: group.id, title: newTitle })
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const findGroup = await Group.findOrFail(group.id);

    assert.equal(group.title, findGroup.title);
    assert.notEqual(findGroup.title, newTitle);
  });

  test("[destroy] - should be able to delete a group", async (assert) => {
    const { user, token } = await generateToken();

    const group = await GroupFactory.merge({ userId: user.id }).create();

    await request
      .delete(`/groups/${group.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const findGroup = await Group.find(group.id);

    assert.notExists(findGroup);
  });

  test("[destroy] - should fail when trying do delete another person's group", async (assert) => {
    const { token } = await generateToken();
    const { user } = await generateToken();

    const group = await GroupFactory.merge({ userId: user.id }).create();

    await request
      .delete(`/groups/${group.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const findGroup = await Group.find(group.id);

    assert.exists(findGroup);
  });

  test("[index] - should be able to list authenticated user's groups", async (assert) => {
    const { user, token } = await generateToken();

    const groups = await generateGroups({ token, amount: 30 });

    const { body } = await request
      .get("/groups?page=1&perPage=100")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.meta);
    assert.exists(body.data);
    assert.equal(body.meta.total, groups.length);

    const queries = groups.map(async (group: Group) => {
      const isMember = await Database.query()
        .from("group_members")
        .where({
          group_id: group.id,
          user_id: user.id
        })
        .firstOrFail();

      assert.exists(isMember);
    });

    await Promise.all(queries);
  });

  test("[show] - should be able to show an authenticated user's group", async (assert) => {
    const { user, token } = await generateToken();

    const groups = await generateGroups({ token, amount: 1 });
    const group = groups[0] as Group;

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
      .firstOrFail();

    assert.exists(isMember);
  });

  test("[show] - should fail when trying to show a group and you are not member of it", async () => {
    const { token } = await generateToken();

    const group = await GroupFactory.create();

    await request
      .get(`/groups/${group.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(404);
  });
});
