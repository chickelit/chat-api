import Database from "@ioc:Adonis/Lucid/Database";
import { User } from "App/Models";
import { UserFactory } from "Database/factories/UserFactory";
import test from "japa";
import { generateToken, request } from "Test/utils";

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
      .get(`/users/search?username=${user.username}&page=1&perPage=20`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const isValid = body.data.some((result: User) => result.id === user.id);

    assert.isTrue(isValid);
  });
});
