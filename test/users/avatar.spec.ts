import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import { generateToken, request } from "Test/utils";

test.group("/users/avatar", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[update] - should be able to update avatar", async (assert) => {
    const { user, token } = await generateToken();

    await request
      .put("/users/avatar")
      .set("authorization", `bearer ${token}`)
      .attach("file", "test/assets/avatar.jpg")
      .expect(200);

    const file = await Database.query()
      .from("files")
      .where({ file_category: "avatar", user_id: user.id })
      .first();

    assert.exists(file);
  });
});
