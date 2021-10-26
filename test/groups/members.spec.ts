import Database from "@ioc:Adonis/Lucid/Database";
import { Group, User } from "App/Models";
import { GroupFactory } from "Database/factories/GroupFactory";
import { UserFactory } from "Database/factories/UserFactory";
import test from "japa";
import { addFriends, addMembers, generateToken, request } from "Test/utils";
import faker from "faker";

test.group("/members", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[store] - should be able to add a member to a group", async (assert) => {
    const { user, token } = await generateToken();
    const { user: member, token: memberToken } = await generateToken();
    const group = await GroupFactory.merge({ userId: user.id }).create();

    await addFriends({ user, token }, [{ user: member, token: memberToken }]);

    await request
      .post("/members")
      .send({
        userId: member.id,
        groupId: group.id
      })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const isMember = await Database.query()
      .from("group_members")
      .where({
        user_id: member.id,
        group_id: group.id
      })
      .first();

    assert.exists(isMember);
  });

  test("[store] - should fail when trying to add yourself to a group", async () => {
    const { user, token } = await generateToken();
    const group = await GroupFactory.merge({ userId: user.id }).create();

    await request
      .post("/members")
      .send({
        userId: user.id,
        groupId: group.id
      })
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[store] - should fail when trying to add someone to another person's group", async (assert) => {
    const { user, token } = await generateToken();
    const { user: member, token: memberToken } = await generateToken();
    const groupOwner = await UserFactory.create();
    const group = await GroupFactory.merge({ userId: groupOwner.id }).create();

    await addFriends({ user, token }, [{ user: member, token: memberToken }]);

    await request
      .post("/members")
      .send({
        userId: member.id,
        groupId: group.id
      })
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const isMember = await Database.query()
      .from("group_members")
      .where({
        user_id: member.id,
        group_id: group.id
      })
      .first();

    assert.isNull(isMember);
  });

  test("[store] - should fail when trying to add someone to a group and the person is not your friend", async (assert) => {
    const { user, token } = await generateToken();
    const { user: member } = await generateToken();
    const group = await GroupFactory.merge({ userId: user.id }).create();

    await request
      .post("/members")
      .send({
        userId: member.id,
        groupId: group.id
      })
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const isMember = await Database.query()
      .from("group_members")
      .where({
        user_id: member.id,
        group_id: group.id
      })
      .first();

    assert.isNull(isMember);
  });

  test("[store] - should fail when trying to add someone to a group and the person is already a member of it", async () => {
    const { user, token } = await generateToken();
    const { user: member, token: memberToken } = await generateToken();
    const group = await GroupFactory.merge({ userId: user.id }).create();

    await addFriends({ user, token }, [{ user: member, token: memberToken }]);

    await request
      .post("/members")
      .send({
        userId: member.id,
        groupId: group.id
      })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await request
      .post("/members")
      .send({
        userId: member.id,
        groupId: group.id
      })
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[index] - should be able to list members of a group", async (assert) => {
    const { user, token } = await generateToken();
    const array = Array(10).fill(false);
    const queries = array.map(async () => {
      return await generateToken();
    });
    const users = await Promise.all(queries);

    const {
      body: { id: groupId }
    } = await request
      .post("/groups")
      .send({ title: faker.lorem.words(2) })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await addFriends({ user, token }, users);
    await addMembers(groupId, { user, token }, users);

    const { body } = await request
      .get(`/members/${groupId}?page=1&perPage=20`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.meta);
    assert.exists(body.data);
    assert.equal(body.meta.total, users.length + 1);

    users.forEach(({ user }) => {
      const isValid = body.data.some((member: User) => {
        return user.id === member.id;
      });

      assert.isTrue(isValid);
    });
  });

  test("[index] - should show extra data correctly", async (assert) => {
    const { user, token } = await generateToken();
    const array = Array(10).fill(false);
    const queries = array.map(async () => {
      return await generateToken();
    });
    const users = await Promise.all(queries);

    const {
      body: { id: groupId }
    } = await request
      .post("/groups")
      .send({ title: faker.lorem.words(2) })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await addFriends({ user, token }, users);
    await addMembers(groupId, { user, token }, users);

    const { body } = await request
      .get(`/members/${groupId}?page=1&perPage=20`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.meta);
    assert.exists(body.data);
    assert.equal(body.meta.total, users.length + 1);

    users.forEach(({ user }) => {
      const isValid = body.data.some((member: User) => {
        return user.id === member.id;
      });

      assert.isTrue(isValid);
    });
  });

  test("[destroy] - should be able to remove a member from a group", async (assert) => {
    const { user, token } = await generateToken();
    const memberWithToken = await generateToken();

    const {
      body: { id: groupId }
    } = await request
      .post("/groups")
      .send({ title: faker.lorem.words(2) })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await addFriends({ user, token }, [memberWithToken]);
    await addMembers(groupId, { user, token }, [memberWithToken]);

    const group = await Group.findOrFail(groupId);

    const isMember = await Database.query()
      .from("group_members")
      .where({
        user_id: memberWithToken.user.id,
        group_id: group.id
      })
      .first();

    assert.exists(isMember);

    await request
      .delete(`/members?groupId=${group.id}&userId=${memberWithToken.user.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const isStillMember = await Database.query()
      .from("group_members")
      .where({
        user_id: memberWithToken.user.id,
        group_id: group.id
      })
      .first();

    assert.isNull(isStillMember);
  });

  test("[destroy] - should be able to leave a group if you does not own it", async (assert) => {
    const { user, token } = await generateToken();
    const memberWithToken = await generateToken();

    const {
      body: { id: groupId }
    } = await request
      .post("/groups")
      .send({ title: faker.lorem.words(2) })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await addFriends({ user, token }, [memberWithToken]);
    await addMembers(groupId, { user, token }, [memberWithToken]);

    const group = await Group.findOrFail(groupId);

    const isMember = await Database.query()
      .from("group_members")
      .where({
        user_id: memberWithToken.user.id,
        group_id: group.id
      })
      .first();

    assert.exists(isMember);

    await request
      .delete(`/members?groupId=${group.id}&userId=${memberWithToken.user.id}`)
      .set("authorization", `bearer ${memberWithToken.token}`)
      .expect(200);

    const isStillMember = await Database.query()
      .from("group_members")
      .where({
        user_id: memberWithToken.user.id,
        group_id: group.id
      })
      .first();

    assert.isNull(isStillMember);
  });

  test("[destroy] - should fail when trying to leave a group and you own it", async (assert) => {
    const { user, token } = await generateToken();

    const {
      body: { id: groupId }
    } = await request
      .post("/groups")
      .send({ title: faker.lorem.words(2) })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const group = await Group.findOrFail(groupId);

    await request
      .delete(`/members?groupId=${group.id}&userId=${user.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const isMember = await Database.query()
      .from("group_members")
      .where({
        user_id: user.id,
        group_id: group.id
      })
      .first();

    assert.exists(isMember);
  });

  test("[destroy] - should fail when trying to remove a member from a group, but the person is not member of it", async () => {
    const { token } = await generateToken();
    const member = await UserFactory.create();

    const {
      body: { id: groupId }
    } = await request
      .post("/groups")
      .send({ title: faker.lorem.words(2) })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const group = await Group.findOrFail(groupId);

    await request
      .delete(`/members?groupId=${group.id}&userId=${member.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });
});
