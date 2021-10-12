import Database from "@ioc:Adonis/Lucid/Database";
import { UserFactory } from "Database/factories/UserFactory";
import test from "japa";
import { addFriends, blockUsers, generateToken, request } from "Test/utils";

test.group("/users/search", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[show] - should be able to show a user through his username", async (assert) => {
    const user = await UserFactory.merge({ password: "secret" }).create();
    const { token } = await generateToken();

    const { body } = await request
      .get(`/users/search?username=${user.username}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.id);
    assert.exists(body.email);
    assert.exists(body.name);
    assert.exists(body.username);
    assert.deepEqual(body.id, user.id);
    assert.deepEqual(body.email, user.email);
    assert.deepEqual(body.name, user.name);
    assert.deepEqual(body.username, user.username);
  });

  test("[show] - should show extra data correctly", async (assert) => {
    const queryUserWithToken = await generateToken();
    const { user, token } = await generateToken();

    await addFriends(queryUserWithToken, [{ user, token }]);
    await blockUsers(token, [queryUserWithToken.user]);

    const { body } = await request
      .get(`/users/search?username=${queryUserWithToken.user.username}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.id);
    assert.exists(body.email);
    assert.exists(body.name);
    assert.exists(body.username);
    assert.deepEqual(body.id, queryUserWithToken.user.id);
    assert.deepEqual(body.email, queryUserWithToken.user.email);
    assert.deepEqual(body.name, queryUserWithToken.user.name);
    assert.deepEqual(body.username, queryUserWithToken.user.username);
    assert.exists(body.blocked);
    assert.exists(body.isBlocked);
    assert.exists(body.friendship);
    assert.isFalse(body.blocked);

    /* --- */
    assert.isTrue(body.isBlocked);
    assert.isTrue(body.friendship);
  });
});
