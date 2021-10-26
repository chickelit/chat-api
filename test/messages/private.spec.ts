import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import { request, generateToken, addFriends, sendMessages } from "Test/utils";
import faker from "faker";

test.group("/messages/conversation", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[store] - should be able to send a text message", async (assert) => {
    const { user, token } = await generateToken();
    const { user: friend, token: friendToken } = await generateToken();

    await addFriends({ user, token }, [{ user: friend, token: friendToken }]);

    const {
      body: { id: conversationId }
    } = await request
      .post("/conversations")
      .send({ userId: friend.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const content = faker.lorem.paragraph();

    const { body } = await request
      .post("/messages/conversation/text")
      .send({
        conversationId,
        content
      })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const message = await Database.query()
      .from("messages")
      .where({ id: body.id })
      .first();

    assert.exists(message);
    assert.exists(message.conversation_id);
    assert.isNull(message.group_id);
    assert.exists(message.user_id);
    assert.exists(message.content);
    assert.exists(message.category);
    assert.equal(message.category, "text");
    assert.equal(message.user_id, user.id);
    assert.equal(message.conversation_id, body.conversationId);
    assert.equal(message.content, content);
  });

  test("[store] - should fail when trying to send a message to a conversation you are not part of", async () => {
    const { token } = await generateToken();
    const { user, token: userToken } = await generateToken();
    const { user: friend, token: friendToken } = await generateToken();

    await addFriends({ user, token: userToken }, [
      { user: friend, token: friendToken }
    ]);

    const {
      body: { id: conversationId }
    } = await request
      .post("/conversations")
      .send({ userId: friend.id })
      .set("authorization", `bearer ${userToken}`)
      .expect(200);

    await request
      .post("/messages/conversation/text")
      .send({
        conversationId,
        content: faker.lorem.paragraph()
      })
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[store] - should fail when trying to send a message to someone who is not your friend", async () => {
    const { user, token } = await generateToken();
    const { user: friend, token: friendToken } = await generateToken();

    await addFriends({ user, token }, [{ user: friend, token: friendToken }]);

    const {
      body: { id: conversationId }
    } = await request
      .post("/conversations")
      .send({ userId: friend.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await request
      .delete(`/friendships/${friend.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await request
      .post("/messages/conversation/text")
      .send({
        conversationId,
        content: faker.lorem.paragraph()
      })
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[store] - should be able to send a media", async (assert) => {
    const { user, token } = await generateToken();
    const { user: friend, token: friendToken } = await generateToken();

    await addFriends({ user, token }, [{ user: friend, token: friendToken }]);

    const {
      body: { id: conversationId }
    } = await request
      .post("/conversations")
      .send({ userId: friend.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const { body } = await request
      .post(`/messages/conversation/${conversationId}/media`)
      .attach("file", "test/assets/media.jpg")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const message = await Database.query()
      .from("messages")
      .where({ id: body.id })
      .first();

    assert.exists(message);
    assert.exists(message.conversation_id);
    assert.exists(message.user_id);
    assert.exists(body.category);
    assert.equal(message.category, "media");
    assert.equal(message.user_id, user.id);
    assert.equal(message.conversation_id, body.conversationId);

    const file = await Database.query()
      .from("files")
      .where({
        message_id: message.id
      })
      .first();

    assert.exists(file);
  });

  test("[store] - should fail when trying to send a media to a conversation you are not part of", async () => {
    const { token } = await generateToken();
    const { user, token: userToken } = await generateToken();
    const { user: friend, token: friendToken } = await generateToken();

    await addFriends({ user, token: userToken }, [
      { user: friend, token: friendToken }
    ]);

    const {
      body: { id: conversationId }
    } = await request
      .post("/conversations")
      .send({ userId: friend.id })
      .set("authorization", `bearer ${userToken}`)
      .expect(200);

    await request
      .post(`/messages/conversation/${conversationId}/media`)
      .attach("file", "test/assets/media.jpg")
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[store] - should fail when trying to send a media to someone who is not your friend", async () => {
    const { user, token } = await generateToken();
    const { user: friend, token: friendToken } = await generateToken();

    await addFriends({ user, token }, [{ user: friend, token: friendToken }]);

    const {
      body: { id: conversationId }
    } = await request
      .post("/conversations")
      .send({ userId: friend.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await request
      .delete(`/friendships/${friend.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await request
      .post(`/messages/conversation/${conversationId}/media`)
      .attach("file", "test/assets/media.jpg")
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[index] - should be able to list a conversation's message list", async (assert) => {
    const { user, token } = await generateToken();
    const { user: friend, token: friendToken } = await generateToken();

    await addFriends({ user, token }, [{ user: friend, token: friendToken }]);

    const {
      body: { id: conversationId }
    } = await request
      .post("/conversations")
      .send({ userId: friend.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const payload = await sendMessages(token, 10, conversationId);

    const { body } = await request
      .get(`/messages/conversation/${conversationId}?page=1&perPage=200`)
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
  });

  test("[index] - should fail when trying to list messages from a conversation you are not part of", async () => {
    const { token } = await generateToken();
    const { user, token: userToken } = await generateToken();
    const { user: friend, token: friendToken } = await generateToken();

    await addFriends({ user, token: userToken }, [
      { user: friend, token: friendToken }
    ]);

    const {
      body: { id: conversationId }
    } = await request
      .post("/conversations")
      .send({ userId: friend.id })
      .set("authorization", `bearer ${userToken}`)
      .expect(200);

    await request
      .get(`/messages/conversation/${conversationId}?page=1&perPage=200`)
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });
});
