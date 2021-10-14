import Database from "@ioc:Adonis/Lucid/Database";
import { User } from "App/Models";
import test from "japa";
import {
  blockUsers,
  generateToken,
  request,
  sendFriendshipRequests
} from "../utils";

test.group("/friendships/requests", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[store] - should be able to send a friendship request", async (assert) => {
    const { user: friend } = await generateToken();
    const { user, token } = await generateToken();

    await request
      .post("/friendships/requests")
      .send({ userId: friend.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const friendshipRequest = await Database.query()
      .from("friendship_requests")
      .where({ user_id: user.id, friend_id: friend.id })
      .first();

    assert.exists(friendshipRequest);
    assert.equal(friendshipRequest.user_id, user.id);
    assert.equal(friendshipRequest.friend_id, friend.id);
  });

  test("[store] - should fail when trying to send a friendship request to the authenticated user", async (assert) => {
    const { user, token } = await generateToken();

    await request
      .post("/friendships/requests")
      .send({ userId: user.id })
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const friendshipRequest = await Database.query()
      .from("friendship_requests")
      .where({ user_id: user.id, friend_id: user.id })
      .first();

    assert.isNull(friendshipRequest);
  });

  test("[store] - should fail when trying to send a friendship request and it already exists", async () => {
    const { user: friend } = await generateToken();
    const { token } = await generateToken();

    await request
      .post("/friendships/requests")
      .send({ userId: friend.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await request
      .post("/friendships/requests")
      .send({ userId: friend.id })
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[store] - should fail when trying to send a friendship request and the other user already sent one", async (assert) => {
    const { user: friend, token: friendToken } = await generateToken();
    const { user, token } = await generateToken();

    await request
      .post("/friendships/requests")
      .send({ userId: friend.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await request
      .post("/friendships/requests")
      .send({ userId: user.id })
      .set("authorization", `bearer ${friendToken}`)
      .expect(400);

    const friendshipRequestOne = await Database.query()
      .from("friendship_requests")
      .where({ user_id: user.id, friend_id: friend.id })
      .first();

    assert.exists(friendshipRequestOne);

    const friendshipRequestTwo = await Database.query()
      .from("friendship_requests")
      .where({ user_id: friend.id, friend_id: user.id })
      .first();

    assert.isNull(friendshipRequestTwo);
  });

  test("[store] - should fail when trying to send a friendship request to a blocked user", async (assert) => {
    const { user, token } = await generateToken();
    const { user: blockedUser } = await generateToken();

    await blockUsers(token, [blockedUser]);

    await request
      .post("/friendships/requests")
      .send({ userId: blockedUser.id })
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const friendshipRequest = await Database.query()
      .from("friendship_requests")
      .where({ user_id: user.id, friend_id: blockedUser.id })
      .first();

    assert.isNull(friendshipRequest);
  });

  test("[store] - should fail when trying to send a friendship request and you are blocked", async (assert) => {
    const { user, token } = await generateToken();
    const { user: blockedUser, token: blockedUserToken } =
      await generateToken();

    await blockUsers(token, [blockedUser]);

    await request
      .post("/friendships/requests")
      .send({ userId: user.id })
      .set("authorization", `bearer ${blockedUserToken}`)
      .expect(400);

    const friendshipRequest = await Database.query()
      .from("friendship_requests")
      .where({ user_id: blockedUser.id, friend_id: user.id })
      .first();

    assert.isNull(friendshipRequest);
  });

  test("[index] - should be able to list authenticated user pending friendship requests", async (assert) => {
    const { user, token } = await generateToken();
    const array = Array(10).fill(false);
    const queries = array.map(async () => {
      return await generateToken();
    });
    const users = await Promise.all(queries);

    await sendFriendshipRequests(
      user.id,
      users.map((user) => user.token)
    );

    const { body } = await request
      .get("/friendships/requests?page=1&perPage=20")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.meta);
    assert.exists(body.data);
    assert.equal(body.meta.total, users.length);

    users.forEach(({ user }) => {
      const isValid = body.data.some((friendshipRequestUser: User) => {
        return user.id === friendshipRequestUser.id;
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

    const blockedUsers = users
      .slice(1, 5)
      .map((userWithToken) => userWithToken.user);

    await sendFriendshipRequests(
      user.id,
      users.map((user) => user.token)
    );

    await blockUsers(token, blockedUsers);

    const { body } = await request
      .get("/friendships/requests?page=1&perPage=20")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.meta);
    assert.exists(body.data);
    assert.equal(body.meta.total, users.length);

    users.forEach(({ user }) => {
      const isValid = body.data.some((friendshipRequestUser: User) => {
        return user.id === friendshipRequestUser.id;
      });

      assert.isTrue(isValid);
    });

    const findBlockedFriends = users.filter(
      ({ user: friend }) => friend.isBlocked
    );

    findBlockedFriends.forEach(({ user }) => {
      const isValid = body.data.some((friend: User) => {
        return user.isBlocked === friend.isBlocked;
      });

      assert.isTrue(isValid);
    });
  });

  test("[destroy] - should be able to refuse a friendship request", async (assert) => {
    const { user, token } = await generateToken();
    const userWithToken = await generateToken();

    await sendFriendshipRequests(user.id, [userWithToken.token]);

    await request
      .delete(`/friendships/requests/${userWithToken.user.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const friendshipRequest = await Database.query()
      .from("friendship_requests")
      .where({ user_id: userWithToken.user.id, friend_id: user.id })
      .first();

    assert.isNull(friendshipRequest);
  });

  test("[destroy] - should not be able to refuse a friendship request from yourself", async (assert) => {
    const { user, token } = await generateToken();

    await request
      .delete(`/friendships/requests/${user.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const friendshipRequest = await Database.query()
      .from("friendship_requests")
      .where({ user_id: user.id, friend_id: user.id })
      .first();

    assert.isNull(friendshipRequest);
  });

  test("[destroy] - should not be able to refuse a friendship request that does not exist", async (assert) => {
    const { user, token } = await generateToken();
    const { user: temporaryUser, token: temporaryToken } =
      await generateToken();

    await sendFriendshipRequests(user.id, [temporaryToken]);
    await temporaryUser.delete();

    const friendshipRequest = await Database.query()
      .from("friendship_requests")
      .where({ user_id: temporaryUser.id, friend_id: user.id })
      .first();

    assert.isNull(friendshipRequest);

    await request
      .delete(`/friendships/requests/${temporaryUser.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });
});
