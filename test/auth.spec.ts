import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import { request } from "Test/utils";
import { UserFactory } from "Database/factories/UserFactory";
import { generateToken } from "./utils";

test.group("/auth", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("should be able to authenticate with valid credentials", async (assert) => {
    const user = await UserFactory.merge({ password: "secret" }).create();

    const { body } = await request
      .post("/auth")
      .send({ email: user.email, password: "secret" })
      .expect(200);

    assert.exists(body.token);
  });

  test("should fail when email does not exist", async () => {
    await request.post("/auth").expect(422);
  });

  test("should be able to logout when authenticated", async (assert) => {
    const { token } = await generateToken();

    await request
      .delete("/auth")
      .set("Authorization", `bearer ${token}`)
      .expect(200);

    const findToken = await Database.query()
      .from("api_tokens")
      .where({ token })
      .first();

    assert.isNull(findToken);
  });
});
