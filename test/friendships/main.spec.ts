import Database from "@ioc:Adonis/Lucid/Database";
import { User } from "App/Models";
import { UserFactory } from "Database/factories/UserFactory";
import test from "japa";
import {
  addFriends,
  request,
  sendFriendshipRequests,
  generateToken
} from "Test/utils";

test.group("/friendships", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[store] - should be able to accept a friendship request", async (assert) => {
    const { user: friend, token: friendToken } = await generateToken();
    const { user, token } = await generateToken();

    await sendFriendshipRequests(user.id, [friendToken]);

    await request
      .post("/friendships")
      .send({ userId: friend.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const friendship = [
      await Database.query()
        .from("friendships")
        .where({
          user_id: user.id,
          friend_id: friend.id
        })
        .first(),
      await Database.query()
        .from("friendships")
        .where({ user_id: friend.id, friend_id: user.id })
        .first()
    ].every((condition: any) => !!condition);

    assert.isTrue(friendship);

    const friendshipRequest = await Database.query()
      .from("friendship_requests")
      .where({ user_id: friend.id, friend_id: user.id })
      .first();

    assert.isNull(friendshipRequest);
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
      await Database.query()
        .from("friendships")
        .where({
          user_id: user.id,
          friend_id: friend.id
        })
        .first(),
      await Database.query()
        .from("friendships")
        .where({ user_id: friend.id, friend_id: user.id })
        .first()
    ].every((condition: any) => !!condition);

    assert.isFalse(friendship);

    const friendshipRequest = await Database.query()
      .from("friendship_requests")
      .where({ user_id: friend.id, friend_id: user.id })
      .first();

    assert.isNull(friendshipRequest);
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
    const array = Array(10).fill(false);
    const queries = array.map(async () => {
      return await generateToken();
    });
    const friends = await Promise.all(queries);

    await addFriends({ user, token }, friends);

    const { body } = await request
      .get("/friendships?page=1&perPage=20")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.meta);
    assert.exists(body.data);
    assert.equal(body.meta.total, friends.length);

    friends.forEach(({ user }) => {
      const isValid = body.data.some((friend: User) => {
        return user.id === friend.id;
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
    const friends = await Promise.all(queries);
    await addFriends({ user, token }, friends);

    const { body } = await request
      .get("/friendships?page=1&perPage=20")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.meta);
    assert.exists(body.data);
    assert.equal(body.meta.total, friends.length);

    friends.forEach(({ user }) => {
      const isValid = body.data.some((friend: User) => {
        return user.id === friend.id;
      });

      assert.isTrue(isValid);
    });
  });

  test("[destroy] - should be able to delete a friendship", async (assert) => {
    const { user, token } = await generateToken();
    const friendWithToken = await generateToken();

    await addFriends({ user, token }, [friendWithToken]);

    await request
      .delete(`/friendships/${friendWithToken.user.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const friendship = [
      await Database.query()
        .from("friendships")
        .where({
          user_id: user.id,
          friend_id: friendWithToken.user.id
        })
        .first(),
      await Database.query()
        .from("friendships")
        .where({ user_id: friendWithToken.user.id, friend_id: user.id })
        .first()
    ].every((condition: any) => !!condition);

    assert.isFalse(friendship);
  });

  test("[destroy] - should fail when trying to delete a friendship that does not exist", async () => {
    const { token } = await generateToken();
    const userWithToken = await generateToken();

    await request
      .delete(`/friendships/${userWithToken.user.id}`)
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
