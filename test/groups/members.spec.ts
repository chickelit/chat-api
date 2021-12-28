import Database from "@ioc:Adonis/Lucid/Database";
import { Group, User } from "App/Models";
import { GroupFactory } from "Database/factories/GroupFactory";
import { UserFactory } from "Database/factories/UserFactory";
import test from "japa";
import {
  authenticate,
  generateFriend,
  generateGroups,
  generateMembers,
  generateToken,
  request
} from "Test/utils";

test.group("/members", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[store] - should be able to add a member to a group", async (assert) => {
    const { user, token } = await generateToken();
    const groups = await generateGroups({
      token,
      amount: 1
    });
    const group = groups[0] as Group;

    const { friend } = await generateFriend({ user, token });

    await request
      .post("/members")
      .send({
        userId: friend.id,
        groupId: group.id
      })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const isMember = await Database.query()
      .from("group_members")
      .where({
        user_id: friend.id,
        group_id: group.id
      })
      .first();

    assert.exists(isMember);
  });

  test("[store] - should fail when trying to add yourself to a group", async () => {
    const { user, token } = await generateToken();
    const groups = await generateGroups({
      token,
      amount: 1
    });
    const group = groups[0] as Group;

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
    const { friend } = await generateFriend({ user, token });

    const group = await GroupFactory.create();

    await request
      .post("/members")
      .send({
        userId: friend.id,
        groupId: group.id
      })
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const isMember = await Database.query()
      .from("group_members")
      .where({
        user_id: friend.id,
        group_id: group.id
      })
      .first();

    assert.notExists(isMember);
  });

  test("[store] - should fail when trying to add someone to a group and the person is not your friend", async (assert) => {
    const { token } = await generateToken();
    const user = await UserFactory.create();

    const group = await GroupFactory.create();

    await request
      .post("/members")
      .send({
        userId: user.id,
        groupId: group.id
      })
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const isMember = await Database.query()
      .from("group_members")
      .where({
        user_id: user.id,
        group_id: group.id
      })
      .first();

    assert.notExists(isMember);
  });

  test("[store] - should fail when trying to add someone to a group and the person is already a member of it", async (assert) => {
    const { user, token } = await generateToken();
    const groups = await generateGroups({ token, amount: 1 });
    const group = groups[0] as Group;

    const { members } = await generateMembers({
      group,
      user,
      token,
      amount: 1
    });
    const member = members[0] as User;

    const isMember = await Database.query()
      .from("group_members")
      .where({
        user_id: member.id,
        group_id: group.id
      })
      .first();

    assert.exists(isMember);

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
    const { user: me, token } = await generateToken();
    const groups = await generateGroups({
      token,
      amount: 1
    });
    const group = groups[0] as Group;

    const { members } = await generateMembers({
      group,
      user: me,
      token,
      amount: 30
    });

    const { body } = await request
      .get(`/members/${group.id}?page=1&perPage=20`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.meta);
    assert.exists(body.data);
    /* -1 is the authenticated user */
    assert.equal(body.meta.total - 1, members.length);

    body.data.forEach((user: User) => {
      if (user.id !== me.id) {
        const isMember = members.some((member: User) => member.id === user.id);

        assert.isTrue(isMember);
      }
    });
  });

  test("[destroy] - should be able to remove a member from a group", async (assert) => {
    const { user, token } = await generateToken();
    const groups = await generateGroups({
      token,
      amount: 1
    });
    const group = groups[0] as Group;

    const { members } = await generateMembers({
      group,
      user,
      token,
      amount: 1
    });
    const member = members[0] as User;

    await request
      .delete(`/members?groupId=${group.id}&userId=${member.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const isMember = await Database.query()
      .from("group_members")
      .where({
        user_id: member.id,
        group_id: group.id
      })
      .first();

    assert.notExists(isMember);
  });

  test("[destroy] - should fail when trying to remove a member from a group you did not create", async (assert) => {
    const { user: owner, token: ownerToken } = await generateToken();
    const groups = await generateGroups({
      token: ownerToken,
      amount: 1
    });
    const group = groups[0] as Group;

    const { members } = await generateMembers({
      group,
      user: owner,
      token: ownerToken,
      amount: 1
    });
    const member = members[0] as User;

    const { token } = await generateToken();

    await request
      .delete(`/members?groupId=${group.id}&userId=${member.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const isMember = await Database.query()
      .from("group_members")
      .where({
        user_id: member.id,
        group_id: group.id
      })
      .firstOrFail();

    assert.exists(isMember);
  });

  test("[destroy] - should be able to leave a group if you did not create it", async (assert) => {
    const { user: owner, token: ownerToken } = await generateToken();
    const groups = await generateGroups({
      token: ownerToken,
      amount: 1
    });
    const group = groups[0] as Group;

    const { members } = await generateMembers({
      group,
      user: owner,
      token: ownerToken,
      amount: 1
    });
    const member = members[0] as User;

    const { token } = await authenticate({
      email: member.email,
      password: "secret"
    });

    await request
      .delete(`/members?groupId=${group.id}&userId=${member.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const isMember = await Database.query()
      .from("group_members")
      .where({
        user_id: member.id,
        group_id: group.id
      })
      .first();

    assert.notExists(isMember);
  });

  test("[destroy] - should fail when trying to leave a group and you created it", async (assert) => {
    const { user, token } = await generateToken();
    const groups = await generateGroups({
      token: token,
      amount: 1
    });
    const group = groups[0] as Group;

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
    const groups = await generateGroups({
      token,
      amount: 1
    });
    const group = groups[0] as Group;

    const member = await UserFactory.create();

    await request
      .delete(`/members?groupId=${group.id}&userId=${member.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });
});
