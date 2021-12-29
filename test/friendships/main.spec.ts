import Database from "@ioc:Adonis/Lucid/Database";
import { Friendship, FriendshipRequest, User } from "App/Models";
import { UserFactory } from "Database/factories/UserFactory";
import test from "japa";
import {
  request,
  generateToken,
  generatePendingFriendshipRequests,
  generateFriend
} from "Test/utils";

test.group("/friendships", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[store] - should be able to accept a friendship request", async (assert) => {
    const { user: me, token } = await generateToken();

    const friendshipRequests = (await generatePendingFriendshipRequests({
      user: me,
      amount: 1
    })) as {
      user: User;
      friendshipRequest: FriendshipRequest;
    }[];

    const { user, friendshipRequest } = friendshipRequests[0];

    await request
      .post("/friendships")
      .send({ userId: user.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const friendship = [
      await Friendship.query()
        .where({
          userId: friendshipRequest.userId,
          friendId: friendshipRequest.friendId
        })
        .first(),
      await Friendship.query()
        .where({
          userId: friendshipRequest.friendId,
          friendId: friendshipRequest.userId
        })
        .first()
    ].every((condition) => condition);

    assert.isTrue(friendship);

    const findFriendshipRequest = await FriendshipRequest.query()
      .where({
        userId: friendshipRequest.userId,
        friendId: friendshipRequest.friendId
      })
      .first();

    assert.isNull(findFriendshipRequest);
  });

  test("[store] - should fail when trying to accept a friendship request that does not exist", async (assert) => {
    const friend = await UserFactory.create();
    const { user, token } = await generateToken();

    await request
      .post("/friendships")
      .send({ userId: friend.id })
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const friendship = [
      await Friendship.query()
        .where({
          userId: user.id,
          friendId: friend.id
        })
        .first(),
      await Friendship.query()
        .where({
          userId: friend.id,
          friendId: user.id
        })
        .first()
    ].every((condition) => condition);

    assert.isFalse(friendship);
  });

  test("[store] - should fail when trying to accept a friendship request from yourself", async () => {
    const { user, token } = await generateToken();

    await request
      .post("/friendships")
      .send({ userId: user.id })
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[index] - should be able to list authenticated user's friends", async (assert) => {
    const { user, token } = await generateToken();

    const queries = Array(30)
      .fill(false)
      .map(async () => {
        const friend = await generateFriend({ user });

        return friend;
      });

    const friends = await Promise.all(queries);

    const { body } = await request
      .get("/friendships?page=1&perPage=100")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.meta);
    assert.exists(body.data);
    assert.equal(body.meta.total, friends.length);

    friends.forEach(({ friend }) => {
      const isValid = body.data.some((user: User) => {
        return user.id === friend.id;
      });

      assert.isTrue(isValid);
    });
  });

  test("[destroy] - should be able to delete a friendship", async (assert) => {
    const { user, token } = await generateToken();

    const { friend } = await generateFriend({ user });

    await request
      .delete(`/friendships/${friend.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const friendship = [
      await Friendship.query()
        .where({
          userId: user.id,
          friendId: friend.id
        })
        .first(),
      await Friendship.query()
        .where({
          userId: friend.id,
          friendId: user.id
        })
        .first()
    ].every((condition) => condition);

    assert.isFalse(friendship);
  });

  test("[destroy] - should fail when trying to delete a friendship that does not exist", async () => {
    const { token } = await generateToken();
    const user = await UserFactory.create();

    await request
      .delete(`/friendships/${user.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[destroy] - should fail when trying to delete a friendship with yourself", async () => {
    const { user, token } = await generateToken();

    await request
      .delete(`/friendships/${user.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });
});
