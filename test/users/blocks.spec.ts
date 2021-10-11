import Database from "@ioc:Adonis/Lucid/Database";
import { User } from "App/Models";
import { UserFactory } from "Database/factories/UserFactory";
import test from "japa";
import { addFriends, blockUsers, generateToken, request } from "Test/utils";

test.group("/users/blocks", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[store] - should be able to block a user", async (assert) => {
    const blockedUser = await UserFactory.create();
    const { user, token } = await generateToken();

    await request
      .post(`/users/blocks`)
      .send({ userId: blockedUser.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const block = await Database.query()
      .from("user_blocks")
      .where({ user_id: user.id, blocked_user_id: blockedUser.id })
      .first();

    assert.exists(block);
  });

  test("[store] - should delete friendship when a user is blocked", async (assert) => {
    const blockedUserWithToken = await generateToken();
    const { user, token } = await generateToken();

    await addFriends({ user, token }, [blockedUserWithToken]);

    const friendship = [
      await Database.query()
        .from("friendships")
        .where({
          user_id: user.id,
          friend_id: blockedUserWithToken.user.id
        })
        .first(),
      await Database.query()
        .from("friendships")
        .where({ user_id: blockedUserWithToken.user.id, friend_id: user.id })
        .first()
    ].every((condition: any) => !!condition);

    assert.isTrue(friendship);

    await request
      .post(`/users/blocks`)
      .send({ userId: blockedUserWithToken.user.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const block = await Database.query()
      .from("user_blocks")
      .where({
        user_id: user.id,
        blocked_user_id: blockedUserWithToken.user.id
      })
      .first();

    assert.exists(block);

    const findFriendship = [
      await Database.query()
        .from("friendships")
        .where({
          user_id: user.id,
          friend_id: blockedUserWithToken.user.id
        })
        .first(),
      await Database.query()
        .from("friendships")
        .where({ user_id: blockedUserWithToken.user.id, friend_id: user.id })
        .first()
    ].every((condition: any) => !!condition);

    assert.isFalse(findFriendship);
  });

  test("[store] - should fail when trying to block authenticated user", async (assert) => {
    const { user, token } = await generateToken();

    await request
      .post(`/users/blocks`)
      .send({ userId: user.id })
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const block = await Database.query()
      .from("user_blocks")
      .where({ user_id: user.id, blocked_user_id: user.id })
      .first();

    assert.isNull(block);
  });

  test("[store] - should fail when trying to block a blocked user", async (assert) => {
    const blockedUser = await UserFactory.create();
    const { user, token } = await generateToken();

    await request
      .post(`/users/blocks`)
      .send({ userId: blockedUser.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await request
      .post(`/users/blocks`)
      .send({ userId: blockedUser.id })
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const block = await Database.query()
      .from("user_blocks")
      .where({ user_id: user.id, blocked_user_id: blockedUser.id })
      .first();

    assert.exists(block);
  });

  test("[store] - should fail when authenticated user is blocked", async (assert) => {
    const { user, token } = await generateToken();
    const { user: blockedUser, token: blockedUserToken } =
      await generateToken();

    await request
      .post(`/users/blocks`)
      .send({ userId: blockedUser.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await request
      .post(`/users/blocks`)
      .send({ userId: user.id })
      .set("authorization", `bearer ${blockedUserToken}`)
      .expect(400);

    const block = await Database.query()
      .from("user_blocks")
      .where({ user_id: blockedUser.id, blocked_user_id: user.id })
      .first();

    assert.isNull(block);
  });

  test("[store] - should fail when trying to block a user who does not exist", async (assert) => {
    const { user, token } = await generateToken();

    await request
      .post(`/users/blocks`)
      .send({ userId: 9999 })
      .set("authorization", `bearer ${token}`)
      .expect(422);

    const block = await Database.query()
      .from("user_blocks")
      .where({ user_id: user.id, blocked_user_id: 9999 })
      .first();

    assert.isNull(block);
  });

  test("[index] - should be able to list authenticated user's blocked user list", async (assert) => {
    const { token } = await generateToken();
    const users = await UserFactory.createMany(10);

    const blockedUsers = await blockUsers(token, users);

    const { body } = await request
      .get("/users/blocks")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.equal(blockedUsers.length, body.length);

    blockedUsers.forEach((blockedUser) => {
      const isInvalid = body.some((user: User) => {
        user.id !== blockedUser.id;
      });

      assert.isFalse(isInvalid);
    });
  });

  test("[destroy] - should be able to unblock a user", async (assert) => {
    const { user, token } = await generateToken();
    const blockedUser = await UserFactory.create();

    await blockUsers(token, [blockedUser]);

    let block = await Database.query()
      .from("user_blocks")
      .where({ user_id: user.id, blocked_user_id: blockedUser.id })
      .first();

    assert.exists(block);

    await request
      .delete(`/users/blocks/${blockedUser.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    block = await Database.query()
      .from("user_blocks")
      .where({ user_id: user.id, blocked_user_id: blockedUser.id })
      .first();

    assert.isNull(block);
  });

  test("[destroy] - should fail when trying to unblock an unblocked user", async () => {
    const { token } = await generateToken();
    const blockedUser = await UserFactory.create();

    await request
      .delete(`/users/blocks/${blockedUser.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[destroy] - should fail when trying to unblock authenticated user", async () => {
    const { token, user } = await generateToken();

    await request
      .delete(`/users/blocks/${user.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });
});
