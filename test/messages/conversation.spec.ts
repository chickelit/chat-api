import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import {
  request,
  generateToken,
  generateConversations,
  generateMessages
} from "Test/utils";
import faker from "faker";
import { Conversation, File, Friendship, Message } from "App/Models";
import { UserFactory } from "Database/factories/UserFactory";

test.group("/messages/conversation", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[store] - should be able to send a text message to a conversation", async (assert) => {
    const { user, token } = await generateToken();

    const conversations = await generateConversations({
      user,
      amount: 1
    });
    const conversation = conversations[0] as Conversation;

    const content = faker.lorem.paragraph();

    const { body } = await request
      .post("/messages/conversation/text")
      .send({
        conversationId: conversation.id,
        content
      })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const message = await Message.findOrFail(body.id);

    assert.exists(message);
    assert.exists(message.conversationId);
    assert.isNull(message.groupId);
    assert.exists(message.userId);
    assert.exists(message.content);
    assert.exists(message.category);
    assert.equal(message.category, "text");
    assert.equal(message.userId, user.id);
    assert.equal(message.conversationId, body.conversationId);
    assert.equal(message.content, content);
  });

  test("[store] - should fail when trying to send a message to a conversation you are not part of", async () => {
    const { token } = await generateToken();

    const userOne = await UserFactory.create();
    const userTwo = await UserFactory.create();

    const conversation = await Conversation.create({
      userIdOne: userOne.id,
      userIdTwo: userTwo.id
    });

    await request
      .post("/messages/conversation/text")
      .send({
        conversationId: conversation.id,
        content: faker.lorem.paragraph()
      })
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[store] - should fail when trying to send a message to someone who is not your friend", async () => {
    const { user, token } = await generateToken();

    const conversations = await generateConversations({
      user,
      amount: 1
    });
    const conversation = conversations[0] as Conversation;

    await Friendship.query()
      .where({
        userId: conversation.userIdOne,
        friendId: conversation.userIdTwo
      })
      .orWhere({
        userId: conversation.userIdTwo,
        friendId: conversation.userIdOne
      })
      .delete();

    const content = faker.lorem.paragraph();

    await request
      .post("/messages/conversation/text")
      .send({
        conversationId: conversation.id,
        content
      })
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[store] - should be able to send a media", async (assert) => {
    const { user, token } = await generateToken();

    const conversations = await generateConversations({
      user,
      amount: 1
    });
    const conversation = conversations[0] as Conversation;

    const { body } = await request
      .post(`/messages/conversation/${conversation.id}/media`)
      .attach("file", "test/assets/media.jpg")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const message = await Message.findOrFail(body.id);

    assert.exists(message);
    assert.exists(message.conversationId);
    assert.isNull(message.groupId);
    assert.exists(message.userId);
    assert.exists(message.category);
    assert.equal(message.category, "media");
    assert.equal(message.userId, user.id);
    assert.equal(message.conversationId, body.conversationId);

    const file = await File.findByOrFail("messageId", message.id);

    assert.exists(file);
  });

  test("[store] - should fail when trying to send a media to a conversation you are not part of", async () => {
    const { token } = await generateToken();

    const userOne = await UserFactory.create();
    const userTwo = await UserFactory.create();

    const conversation = await Conversation.create({
      userIdOne: userOne.id,
      userIdTwo: userTwo.id
    });

    await request
      .post(`/messages/conversation/${conversation.id}/media`)
      .attach("file", "test/assets/media.jpg")
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[store] - should fail when trying to send a media to someone who is not your friend", async () => {
    const { user, token } = await generateToken();

    const conversations = await generateConversations({
      user,
      amount: 1
    });
    const conversation = conversations[0] as Conversation;

    await Friendship.query()
      .where({
        userId: conversation.userIdOne,
        friendId: conversation.userIdTwo
      })
      .orWhere({
        userId: conversation.userIdTwo,
        friendId: conversation.userIdOne
      })
      .delete();

    await request
      .post(`/messages/conversation/${conversation.id}/media`)
      .attach("file", "test/assets/media.jpg")
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[index] - should be able to list a conversation's message list", async (assert) => {
    const { user, token } = await generateToken();

    const conversations = await generateConversations({
      user,
      amount: 1
    });
    const conversation = conversations[0] as Conversation;

    const messages = (await generateMessages({
      conversation,
      amount: 100
    })) as any[];

    const { body } = await request
      .get(`/messages/conversation/${conversation.id}?page=1&perPage=200`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.data);
    assert.exists(body.meta);
    assert.equal(body.meta.total, messages?.length);
    assert.equal(body.data.length, messages?.length);

    body.data.forEach((message: Message) => {
      const isValid =
        messages.some((msg: Message) => msg.id === message.id) &&
        [conversation.userIdOne, conversation.userIdTwo].includes(
          message.userId
        );

      assert.isTrue(isValid);
    });
  });

  test("[index] - should fail when trying to list messages from a conversation you are not part of", async () => {
    const { token } = await generateToken();

    const userOne = await UserFactory.create();
    const userTwo = await UserFactory.create();

    const conversation = await Conversation.create({
      userIdOne: userOne.id,
      userIdTwo: userTwo.id
    });

    await request
      .get(`/messages/conversation/${conversation.id}?page=1&perPage=200`)
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });
});
