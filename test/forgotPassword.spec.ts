import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";

test.group("/register", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("...", async (assert) => {
    // ...
  });
});
