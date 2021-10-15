import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import { generateToken, request } from "Test/utils";
import faker from "faker";

test.group("/members", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[update] - should be able to update a group cover", async (assert) => {
    const { token } = await generateToken();

    const { body: group } = await request
      .post("/groups")
      .send({
        title: faker.lorem.words(2)
      })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await request
      .put(`/groups/${group.id}/cover`)
      .set("authorization", `bearer ${token}`)
      .attach("file", "test/assets/cover.jpg")
      .expect(200);

    const file = await Database.query()
      .from("files")
      .where({ group_id: group.id, file_category: "groupCover" })
      .first();

    assert.exists(file);
  });

  test("[update] - should fail when trying to update another person's group cover", async (assert) => {
    const { token } = await generateToken();
    const { token: otherToken } = await generateToken();

    const { body: group } = await request
      .post("/groups")
      .send({
        title: faker.lorem.words(2)
      })
      .set("authorization", `bearer ${otherToken}`)
      .expect(200);

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

    const { body: group } = await request
      .post("/groups")
      .send({
        title: faker.lorem.words(2)
      })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await request
      .put(`/groups/${group.id}/cover`)
      .set("authorization", `bearer ${token}`)
      .attach("file", "test/assets/cover.jpg")
      .expect(200);

    const file = await Database.query()
      .from("files")
      .where({ group_id: group.id, file_category: "groupCover" })
      .first();

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
    const { token: otherToken } = await generateToken();

    const { body: group } = await request
      .post("/groups")
      .send({
        title: faker.lorem.words(2)
      })
      .set("authorization", `bearer ${otherToken}`)
      .expect(200);

    await request
      .put(`/groups/${group.id}/cover`)
      .set("authorization", `bearer ${otherToken}`)
      .attach("file", "test/assets/cover.jpg")
      .expect(200);

    await request
      .delete(`/groups/${group.id}/cover`)
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const file = await Database.query()
      .from("files")
      .where({ group_id: group.id, file_category: "groupCover" })
      .first();

    assert.exists(file);
  });
});
