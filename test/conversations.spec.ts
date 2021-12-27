import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import {
  request,
  generateFriend,
  generateToken,
  generateConversations
} from "Test/utils";
import { UserFactory } from "Database/factories/UserFactory";
import { Conversation } from "App/Models";

test.group("/conversations", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[store] - should be able to create a conversation", async (assert) => {
    const { user, token } = await generateToken();

    const { friend } = await generateFriend(user, token);

    await request
      .post("/conversations")
      .send({ userId: friend.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const conversation = await Conversation.query()
      .where({ userIdOne: user.id, userIdTwo: friend.id })
      .orWhere({ userIdOne: friend.id, userIdTwo: user.id })
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

    const conversation = await Conversation.query()
      .where({ userIdOne: user.id, userIdTwo: otherUser.id })
      .orWhere({ userIdOne: otherUser.id, userIdTwo: user.id })
      .first();

    assert.isNull(conversation);
  });

  test("[store] - should fail when trying to create a conversation and it already exists", async (assert) => {
    const { user, token } = await generateToken();

    const conversation = (
      await generateConversations({
        user,
        token,
        amount: 1
      })
    )[0] as Conversation;

    const friendId =
      conversation.userIdOne === user.id
        ? conversation.userIdTwo
        : conversation.userIdOne;

    assert.exists(conversation);

    await request
      .post("/conversations")
      .send({ userId: friendId })
      .set("authorization", `bearer ${token}`)
      .expect(400);

    const conversations = await Conversation.query()
      .where({ userIdOne: user.id, userIdTwo: friendId })
      .orWhere({ userIdOne: friendId, userIdTwo: user.id });

    assert.equal(conversations.length, 1);
  });

  test("[index] - should list authenticated user's conversation list correctly", async (assert) => {
    const { user, token } = await generateToken();

    const conversations = (await generateConversations({
      user,
      token,
      amount: 30
    })) as Conversation[];

    const { body } = await request
      .get("/conversations?page=1&perPage=100")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.meta);
    assert.exists(body.data);
    assert.equal(body.meta.total, conversations.length);
    assert.equal(body.data.length, conversations.length);

    body.data.forEach((conversation: Conversation) => {
      assert.exists(conversation.id);
      assert.exists(conversation.userIdOne);
      assert.exists(conversation.userIdTwo);
      assert.exists(conversation.createdAt);
      assert.exists(conversation.updatedAt);
      assert.exists(conversation.friendship);
      assert.exists(conversation.user);
      assert.equal(conversation.friendship, true);
    });
  });

  test("[show] - should be able to show a conversation", async (assert) => {
    const { user, token } = await generateToken();

    const conversation = (
      await generateConversations({
        user,
        token,
        amount: 1
      })
    )[0] as Conversation;

    const { body } = await request
      .get(`/conversations/${conversation.id}`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.id);
    assert.exists(body.userIdOne);
    assert.exists(body.userIdTwo);
    assert.exists(body.createdAt);
    assert.exists(body.updatedAt);
    assert.exists(body.friendship);
    assert.exists(body.user);
    assert.equal(body.friendship, true);
  });
});
