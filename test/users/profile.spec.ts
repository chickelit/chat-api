import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import { generateToken, request } from "Test/utils";
import faker from "faker";
import { User } from "App/Models";

test.group("/users/profile", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[show] - should be able to show authenticated user data", async (assert) => {
    const { user, token } = await generateToken();

    const { body } = await request
      .get("/users/profile")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.id);
    assert.exists(body.email);
    assert.exists(body.name);
    assert.exists(body.username);
    assert.equal(body.id, user.id);
    assert.equal(body.email, user.email);
    assert.equal(body.name, user.name);
    assert.equal(body.username, user.username);
  });

  test("[update] - should be able to update authenticated user data", async (assert) => {
    const { user, token } = await generateToken();

    const { body } = await request
      .put("/users/profile")
      .set("authorization", `bearer ${token}`)
      .send({
        name: faker.name.findName(),
        username: faker.internet.userName()
      });

    assert.notEqual(user.name, body.name);
    assert.notEqual(user.username, body.username);

    const updatedUser = await User.findOrFail(user.id);

    assert.deepEqual(body.name, updatedUser.name);
    assert.deepEqual(body.username, updatedUser.username);
  });
});
