import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import faker from "faker";
import Mail from "@ioc:Adonis/Addons/Mail";
import { forgotPassword, request } from "./utils";
import { UserFactory } from "Database/factories/UserFactory";
import { UserKey } from "App/Models";

test.group("/forgot-password", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[store] - should be able to send an email when it exists", async (assert) => {
    const user = await UserFactory.create();

    Mail.trap((message) => {
      assert.deepEqual(message.to, [{ address: user.email }]);
      assert.deepEqual(message.from, {
        address: "contato@ChatApp.com",
        name: "ChatApp"
      });
      assert.deepEqual(message.subject, "Recuperação de senha");
    });

    await request
      .post("/forgot-password")
      .send({
        email: user.email,
        redirectUrl: faker.internet.url()
      })
      .expect(200);

    Mail.restore();

    const key = await UserKey.query().where({
      userId: user.id
    });

    assert.exists(key);
  });

  test("[store] - should fail when email is not in use", async () => {
    await request
      .post("/forgot-password")
      .send({
        email: faker.internet.email(),
        redirectUrl: faker.internet.url()
      })
      .expect(422);
  });

  test("[show] - should be able to show user data through the generated key", async (assert) => {
    const user = await UserFactory.create();
    const { key } = await forgotPassword({ assert, user });

    const { body } = await request.get(`/forgot-password/${key}`).expect(200);

    assert.exists(body.id);
    assert.exists(body.email);
    assert.exists(body.name);
    assert.exists(body.username);
    assert.deepEqual(user.id, body.id);
    assert.deepEqual(user.email, body.email);
    assert.deepEqual(user.name, body.name);
    assert.deepEqual(user.username, body.username);
  });

  test("[update] - should be able to finish password recovery", async (assert) => {
    const newPassword = "newSecret";
    const oldPassword = "oldSecret";

    const user = await UserFactory.merge({ password: oldPassword }).create();
    const { key } = await forgotPassword({ assert, user });

    await request
      .put("/forgot-password")
      .send({ key, password: newPassword, passwordConfirmation: newPassword })
      .expect(200);

    await request
      .post("/auth")
      .send({ email: user.email, password: oldPassword })
      .expect(400);

    await request
      .post("/auth")
      .send({ email: user.email, password: newPassword })
      .expect(200);

    const findKey = await UserKey.findBy("key", key);

    assert.notExists(findKey);
  });

  test("[update] - should fail when passwordConfirmation is left", async (assert) => {
    const newPassword = "newSecret";
    const oldPassword = "oldSecret";

    const user = await UserFactory.merge({ password: oldPassword }).create();
    const { key } = await forgotPassword({ assert, user });

    await request
      .put("/forgot-password")
      .send({ key, password: newPassword })
      .expect(422);

    const findKey = await UserKey.findBy("key", key);

    assert.exists(findKey);
  });

  test("[update] - should fail when passwordConfirmation is invalid", async (assert) => {
    const newPassword = "newSecret";
    const oldPassword = "oldSecret";

    const user = await UserFactory.merge({ password: oldPassword }).create();
    const { key } = await forgotPassword({ assert, user });

    await request
      .put("/forgot-password")
      .send({
        key,
        password: newPassword,
        passwordConfirmation: faker.internet.password()
      })
      .expect(422);

    const findKey = await UserKey.findBy("key", key);

    assert.exists(findKey);
  });
});
