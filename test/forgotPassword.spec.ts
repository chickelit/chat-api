import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import faker from "faker";
import Mail from "@ioc:Adonis/Addons/Mail";
import { beginPasswordRecovery, request } from "./utils";
import { UserFactory } from "Database/factories/UserFactory";
import { UserKey } from "App/Models";

test.group("/forgot-password", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[store] - should be able to send an email when email is in use", async (assert) => {
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

    const key = await Database.query()
      .from("user_keys")
      .where({ user_id: user.id })
      .first();

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
    const { user, key } = await beginPasswordRecovery(assert);

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
    const { user, key } = await beginPasswordRecovery(assert);
    const newPassword = "newSecret";

    await request
      .put("/forgot-password")
      .send({ key, password: newPassword, passwordConfirmation: newPassword })
      .expect(200);

    await request
      .post("/auth")
      .send({ email: user.email, password: "secret" })
      .expect(400);

    await request
      .post("/auth")
      .send({ email: user.email, password: newPassword })
      .expect(200);

    const findKey = await UserKey.findBy("key", key);

    assert.isNull(findKey);
  });

  test("[update] - should fail when passwordConfirmation is left", async (assert) => {
    const { key } = await beginPasswordRecovery(assert);
    const newPassword = "newSecret";

    await request
      .put("/forgot-password")
      .send({ key, password: newPassword })
      .expect(422);
  });

  test("[update] - should fail when passwordConfirmation is invalid", async (assert) => {
    const { key } = await beginPasswordRecovery(assert);
    const newPassword = "newSecret";

    await request
      .put("/forgot-password")
      .send({
        key,
        password: newPassword,
        passwordConfirmation: faker.internet.password()
      })
      .expect(422);
  });
});
