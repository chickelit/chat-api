import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import { generateGroups, generateToken, request } from "Test/utils";
import { File, Group } from "App/Models";
import { GroupFactory } from "Database/factories/GroupFactory";

test.group("/groups/:id/cover", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[update] - should be able to update a group cover", async (assert) => {
    const { token } = await generateToken();

    const groups = await generateGroups({ token, amount: 1 });
    const group = groups[0] as Group;

    await request
      .put(`/groups/${group.id}/cover`)
      .set("authorization", `bearer ${token}`)
      .attach("file", "test/assets/cover.jpg")
      .expect(200);

    const file = await File.query()
      .where({
        groupId: group.id,
        fileCategory: "groupCover"
      })
      .firstOrFail();

    assert.exists(file);
  });

  test("[update] - should fail when trying to update another person's group cover", async (assert) => {
    const { token } = await generateToken();

    const group = await GroupFactory.create();

    await request
      .put(`/groups/${group.id}/cover`)
      .set("authorization", `bearer ${token}`)
      .attach("file", "test/assets/cover.jpg")
      .expect(400);

    const file = await Database.query()
      .from("files")
      .where({ group_id: group.id, file_category: "groupCover" })
      .first();

    assert.isNull(file);
  });

  test("[destroy] - should be able to delete a group cover", async (assert) => {
    const { token } = await generateToken();

    const groups = await generateGroups({ token, amount: 1 });
    const group = groups[0] as Group;

    await request
      .put(`/groups/${group.id}/cover`)
      .set("authorization", `bearer ${token}`)
      .attach("file", "test/assets/cover.jpg")
      .expect(200);

    const file = await File.query()
      .where({
        groupId: group.id,
        fileCategory: "groupCover"
      })
      .firstOrFail();

    assert.exists(file);

    await request
      .delete(`/groups/${group.id}/cover`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const findFile = await Database.query()
      .from("files")
      .where({ group_id: group.id, file_category: "groupCover" })
      .first();

    assert.isNull(findFile);
  });

  test("[destroy] - should fail when trying to delete another person's group cover", async (assert) => {
    const { token } = await generateToken();
    const { token: myToken } = await generateToken();

    const groups = await generateGroups({ token, amount: 1 });
    const group = groups[0] as Group;

    await request
      .put(`/groups/${group.id}/cover`)
      .set("authorization", `bearer ${token}`)
      .attach("file", "test/assets/cover.jpg")
      .expect(200);

    const file = await File.query()
      .where({
        groupId: group.id,
        fileCategory: "groupCover"
      })
      .firstOrFail();

    assert.exists(file);

    await request
      .delete(`/groups/${group.id}/cover`)
      .set("authorization", `bearer ${myToken}`)
      .expect(400);
  });
});
