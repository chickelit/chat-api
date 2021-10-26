import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import {
  addFriends,
  createConversations,
  request,
  sendMessages
} from "Test/utils";
import { UserFactory } from "Database/factories/UserFactory";
import { generateToken } from "./utils";

test.group("/conversations", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[store] - should be able to create a conversation", async (assert) => {
    const { user, token } = await generateToken();
    const friendWithToken = await generateToken();

    await addFriends({ user, token }, [friendWithToken]);

    await request
      .post("/conversations")
      .send({ userId: friendWithToken.user.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const conversation = await Database.query()
      .from("conversations")
      .where({ user_id_one: user.id, user_id_two: friendWithToken.user.id })
      .orWhere({ user_id_one: friendWithToken.user.id, user_id_two: user.id })
      .first();

    assert.exists(conversation);
  });

  test("[store] - should fail when trying to create a conversation and the other user is not your friend", async (assert) => {
    const { user, token } = await generateToken();
    const otherUser = await UserFactory.create();

    await request
      .post("/conversations")
      .send({ userId: otherUser.id })
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const conversation = await Database.query()
      .from("conversations")
      .where({ user_id_one: user.id, user_id_two: otherUser.id })
      .orWhere({ user_id_one: otherUser.id, user_id_two: user.id })
      .first();

    assert.isNull(conversation);
  });

  test("[store] - should fail when trying to create a conversation and it already exists", async (assert) => {
    const { user, token } = await generateToken();
    const friendWithToken = await generateToken();

    await addFriends({ user, token }, [friendWithToken]);

    await request
      .post("/conversations")
      .send({ userId: friendWithToken.user.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    await request
      .post("/conversations")
      .send({ userId: friendWithToken.user.id })
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const conversation = await Database.query()
      .from("conversations")
      .where({ user_id_one: user.id, user_id_two: friendWithToken.user.id })
      .orWhere({ user_id_one: friendWithToken.user.id, user_id_two: user.id })
      .first();

    assert.exists(conversation);
  });

  test("[index] - should list authenticated user's conversation list correctly", async (assert) => {
    const { user, token } = await generateToken();
    const array = Array(10).fill(false);
    const queries = array.map(async () => {
      return await generateToken();
    });
    const friends = await Promise.all(queries);

    await addFriends({ user, token }, friends);
    await createConversations(
      token,
      friends.map((friendWithToken) => friendWithToken.user)
    );

    const { body } = await request
      .get("/conversations?page=1&perPage=20")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.meta);
    assert.exists(body.data);
    assert.equal(body.meta.total, friends.length);
    assert.equal(body.data.length, friends.length);
  });

  test("[index] - should show extra data correctly", async (assert) => {
    const { user, token } = await generateToken();
    const array = Array(10).fill(false);
    const queries = array.map(async () => {
      return await generateToken();
    });
    const friends = await Promise.all(queries);

    await addFriends({ user, token }, friends);
    const conversations = await createConversations(
      token,
      friends.map((friendWithToken) => friendWithToken.user)
    );
    await Promise.all(
      conversations.map(async (conversation) => {
        await sendMessages(token, 10, conversation.id);
      })
    );

    const { body } = await request
      .get("/conversations?page=1&perPage=20")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.meta);
    assert.exists(body.data);
    assert.equal(body.meta.total, friends.length);
    assert.equal(body.data.length, friends.length);

    await Promise.all(
      body.data.map(async (conversation) => {
        const latestMessage = await Database.query()
          .from("messages")
          .where({ conversation_id: conversation.id })
          .orderBy("created_at", "desc")
          .first();

        assert.equal(conversation.latestMessage.id, latestMessage.id);
        assert.equal(conversation.latestMessage.userId, latestMessage.user_id);
        assert.equal(
          conversation.latestMessage.conversationId,
          latestMessage.conversation_id
        );
        assert.equal(conversation.latestMessage.content, latestMessage.content);
      })
    );

    body.data.forEach((conversation) => assert.isTrue(conversation.friendship));
  });

  test("[show] - should be able to show a conversation", async (assert) => {
    const { user, token } = await generateToken();
    const friendWithToken = await generateToken();

    await addFriends({ user, token }, [friendWithToken]);
    await createConversations(token, [friendWithToken.user]);

    const conversation = await Database.query()
      .from("conversations")
      .where({ user_id_one: user.id, user_id_two: friendWithToken.user.id })
      .orWhere({ user_id_one: friendWithToken.user.id, user_id_two: user.id })
      .first();

    const { body } = await request
      .get(`/conversations/${conversation.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.id);
    assert.exists(body.userIdOne);
    assert.exists(body.userIdTwo);
    assert.exists(body.user);
  });
});
