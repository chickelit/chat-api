import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import { generateToken, request, beginRegister } from "Test/utils";
import faker from "faker";
import Mail from "@ioc:Adonis/Addons/Mail";
import { User, UserKey } from "App/Models";

test.group("/register", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("should be able to send an email when email is unique", async (assert) => {
    const email = faker.internet.email();
    Mail.trap((message) => {
      assert.deepEqual(message.to, [{ address: email }]);
      assert.deepEqual(message.from, {
        address: "contato@ChatApp.com",
        name: "ChatApp"
      });
      assert.deepEqual(message.subject, "Registro");
    });

    await request
      .post("/register")
      .send({
        email,
        redirectUrl: faker.internet.url()
      })
      .expect(200);

    Mail.restore();

    const user = await User.findByOrFail("email", email);
    const key = await Database.query()
      .from("user_keys")
      .where({ user_id: user.id })
      .first();

    assert.exists(key);
  });

  test("should fail when email is already in use", async (assert) => {
    const { user } = await generateToken();

    await request
      .post("/register")
      .send({
        email: user.email,
        redirectUrl: faker.internet.url()
      })
      .expect(422);

    const key = await Database.query()
      .from("user_keys")
      .where({ user_id: user.id })
      .first();

    assert.notExists(key);
  });

  test("should be able to show user data through the generated key", async (assert) => {
    const { user, key } = await beginRegister(assert);

    const { body } = await request.get(`/register/${key}`).expect(200);

    assert.deepEqual(user.id, body.id);
    assert.deepEqual(user.email, body.email);
  });

  test("should be able to complete register through the generated key", async (assert) => {
    const { key } = await beginRegister(assert);
    const { body } = await request
      .put("/register")
      .send({
        key,
        name: faker.name.findName(),
        username: faker.internet.userName(),
        password: "secret",
        passwordConfirmation: "secret"
      })
      .expect(200);

    assert.exists(body.id);
    assert.exists(body.email);
    assert.exists(body.name);
    assert.exists(body.username);

    const findKey = await UserKey.findBy("key", key);

    assert.isNull(findKey);
  });
});
