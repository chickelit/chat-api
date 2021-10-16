import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import { request, generateToken, sendMessages } from "Test/utils";
import faker from "faker";

test.group("/messages/group", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[store] - should be able to send a text message", async (assert) => {
    const { user, token } = await generateToken();

    const { body: group } = await request
      .post("/groups")
      .send({ title: faker.lorem.words(2) })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const content = faker.lorem.paragraph();

    const { body } = await request
      .post("/messages/group/text")
      .send({
        groupId: group.id,
        content
      })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const message = await Database.query()
      .from("messages")
      .where({ id: body.id })
      .first();

    assert.exists(message);
    assert.exists(message.group_id);
    assert.isNull(message.conversation_id);
    assert.exists(message.user_id);
    assert.exists(message.content);
    assert.exists(message.category);
    assert.equal(message.category, "text");
    assert.equal(message.user_id, user.id);
    assert.equal(message.group_id, body.groupId);
    assert.equal(message.content, content);
  });

  test("[store] - should fail when trying to send a message to a group you are not part of", async () => {
    const { token } = await generateToken();
    const { token: otherToken } = await generateToken();

    const { body: group } = await request
      .post("/groups")
      .send({ title: faker.lorem.words(2) })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const content = faker.lorem.paragraph();

    await request
      .post("/messages/group/text")
      .send({
        groupId: group.id,
        content
      })
      .set("authorization", `bearer ${otherToken}`)
      .expect(400);
  });

  test("[store] - should be able to send a media", async (assert) => {
    const { user, token } = await generateToken();

    const { body: group } = await request
      .post("/groups")
      .send({ title: faker.lorem.words(2) })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const { body } = await request
      .post(`/messages/group/${group.id}/media`)
      .attach("file", "test/assets/media.jpg")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const message = await Database.query()
      .from("messages")
      .where({ id: body.id })
      .first();

    assert.exists(message);
    assert.exists(message.group_id);
    assert.isNull(message.conversation_id);
    assert.exists(message.user_id);
    assert.isNull(message.content);
    assert.exists(message.category);
    assert.equal(message.category, "media");
    assert.equal(message.user_id, user.id);
    assert.equal(message.group_id, body.groupId);

    const file = await Database.query()
      .from("files")
      .where({ message_id: message.id })
      .first();

    assert.exists(file);
  });

  test("[store] - should fail when trying to send a media to a group you are not part of", async () => {
    const { token } = await generateToken();
    const { token: otherToken } = await generateToken();

    const { body: group } = await request
      .post("/groups")
      .send({ title: faker.lorem.words(2) })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await request
      .post(`/messages/group/${group.id}/media`)
      .attach("file", "test/assets/media.jpg")
      .set("authorization", `bearer ${otherToken}`)
      .expect(400);
  });

  test("[index] - should be able to list a group's message list", async (assert) => {
    const { user, token } = await generateToken();

    const { body: group } = await request
      .post("/groups")
      .send({ title: faker.lorem.words(2) })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const payload = await sendMessages(token, 10, undefined, group.id);

    const { body } = await request
      .get(`/messages/group/${group.id}?page=1&perPage=20`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.meta);
    assert.exists(body.data);
    assert.equal(body.meta.total, payload.length);
    assert.equal(payload.length, body.data.length);

    payload.forEach((payloadMessage) => {
      const isValid = body.data.some(
        (message) => message.id === payloadMessage.id
      );

      assert.isTrue(isValid);
    });

    body.data.forEach((message) => assert.equal(message.userId, user.id));
  });

  test("[index] - should fail when trying to list a group's message list from a group you are not part of", async () => {
    const { token } = await generateToken();
    const { token: otherToken } = await generateToken();

    const { body: group } = await request
      .post("/groups")
      .send({ title: faker.lorem.words(2) })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await request
      .get(`/messages/group/${group.id}?page=1&perPage=20`)
      .set("authorization", `bearer ${otherToken}`)
      .expect(400);
  });
});
