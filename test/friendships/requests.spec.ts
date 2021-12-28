import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import { FriendshipRequest, User } from "App/Models";
import { UserFactory } from "Database/factories/UserFactory";
import {
  generatePendingFriendshipRequests,
  generateToken,
  request
} from "../utils";

test.group("/friendships/requests", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[store] - should be able to send a friendship request", async (assert) => {
    const { user, token } = await generateToken();
    const friend = await UserFactory.create();

    await request
      .post("/friendships/requests")
      .send({ userId: friend.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const friendshipRequest = await FriendshipRequest.query()
      .where({
        userId: user.id,
        friendId: friend.id
      })
      .firstOrFail();

    assert.exists(friendshipRequest);
    assert.equal(friendshipRequest.userId, user.id);
    assert.equal(friendshipRequest.friendId, friend.id);
  });

  test("[store] - should fail when trying to send a friendship request to yourself", async (assert) => {
    const { user, token } = await generateToken();

    await request
      .post("/friendships/requests")
      .send({ userId: user.id })
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const friendshipRequest = await FriendshipRequest.query()
      .where({
        userId: user.id,
        friendId: user.id
      })
      .first();

    assert.isNull(friendshipRequest);
  });

  test("[store] - should fail when trying to send a friendship request and it already exists", async () => {
    const { user, token } = await generateToken();

    const friendshipRequests = (await generatePendingFriendshipRequests({
      user,
      amount: 1
    })) as {
      user: User;
      friendshipRequest: FriendshipRequest;
    }[];

    const friendshipRequest = friendshipRequests[0];

    await request
      .post("/friendships/requests")
      .send({ userId: friendshipRequest.user.id })
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[store] - should fail when trying to send a friendship request and the other user already sent one", async (assert) => {
    const { user, token } = await generateToken();

    const friendshipRequests = (await generatePendingFriendshipRequests({
      user,
      amount: 1
    })) as {
      user: User;
      friendshipRequest: FriendshipRequest;
    }[];

    const friendshipRequest = friendshipRequests[0];

    await request
      .post("/friendships/requests")
      .send({ userId: friendshipRequest.user.id })
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const friendshipRequestOne = await FriendshipRequest.query()
      .where({
        userId: friendshipRequest.user.id,
        friendId: user.id
      })
      .first();

    assert.exists(friendshipRequestOne);

    const friendshipRequestTwo = await FriendshipRequest.query()
      .where({
        userId: user.id,
        friendId: friendshipRequest.user.id
      })
      .first();

    assert.isNull(friendshipRequestTwo);
  });

  test("[index] - should be able to list authenticated user pending friendship requests", async (assert) => {
    const { user, token } = await generateToken();

    const friendshipRequests = await generatePendingFriendshipRequests({
      user,
      amount: 30
    });

    const { body } = await request
      .get("/friendships/requests?page=1&perPage=100")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.meta);
    assert.exists(body.data);
    assert.equal(body.meta.total, friendshipRequests.length);

    friendshipRequests.forEach(({ user }) => {
      const isValid = body.data.some((friendshipRequestUser: User) => {
        return user.id === friendshipRequestUser.id;
      });

      assert.isUndefined(user.avatar);
      assert.isTrue(isValid);
    });
  });

  test("[destroy] - should be able to refuse a friendship request", async () => {
    const { user, token } = await generateToken();

    const friendshipRequests = (await generatePendingFriendshipRequests({
      user,
      amount: 1
    })) as {
      user: User;
      friendshipRequest: FriendshipRequest;
    }[];

    const friendshipRequest = friendshipRequests[0];

    await request
      .delete(`/friendships/requests/${friendshipRequest.user.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);
  });

  test("[destroy] - should not be able to refuse a friendship request that does not exist", async () => {
    const { token } = await generateToken();
    const { user } = await generateToken();

    await request
      .delete(`/friendships/requests/${user.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });
});
