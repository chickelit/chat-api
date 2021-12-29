import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import {
  request,
  generateToken,
  generateGroups,
  generateMessages
} from "Test/utils";
import faker from "faker";
import { File, Group, Message } from "App/Models";
import { GroupFactory } from "Database/factories/GroupFactory";

test.group("/messages/group", async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction();
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction();
  });

  test("[store] - should be able to send a text message to a group", async (assert) => {
    const { user, token } = await generateToken();

    const groups = await generateGroups({ token, amount: 1 });
    const group = groups[0] as Group;

    const content = faker.lorem.paragraph();

    const { body } = await request
      .post("/messages/group/text")
      .send({
        groupId: group.id,
        content
      })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const message = await Message.findOrFail(body.id);

    assert.exists(message);
    assert.exists(message.groupId);
    assert.isNull(message.conversationId);
    assert.exists(message.userId);
    assert.exists(message.content);
    assert.exists(message.category);
    assert.equal(message.category, "text");
    assert.equal(message.userId, user.id);
    assert.equal(message.groupId, body.groupId);
    assert.equal(message.content, content);
  });

  test("[store] - should fail when trying to send a message to a group you are not part of", async () => {
    const { token } = await generateToken();

    const group = await GroupFactory.create();
    const content = faker.lorem.paragraph();

    await request
      .post("/messages/group/text")
      .send({
        groupId: group.id,
        content
      })
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[store] - should be able to send a media", async (assert) => {
    const { user, token } = await generateToken();

    const groups = await generateGroups({ token, amount: 1 });
    const group = groups[0] as Group;

    const { body } = await request
      .post(`/messages/group/${group.id}/media`)
      .attach("file", "test/assets/media.jpg")
      .set("authorization", `bearer ${token}`)
      .expect(200);

    const message = await Message.findOrFail(body.id);

    await message.load("media");

    assert.exists(message);
    assert.exists(message.groupId);
    assert.isNull(message.conversationId);
    assert.exists(message.userId);
    assert.isNull(message.content);
    assert.exists(message.category);
    assert.equal(message.category, "media");
    assert.equal(message.userId, user.id);
    assert.equal(message.groupId, body.groupId);

    assert.exists(message.media);
    assert.exists(message.media.url);

    const file = await File.findOrFail(message.media.id);

    assert.exists(file);
  });

  test("[store] - should fail when trying to send a media to a group you are not part of", async () => {
    const { token } = await generateToken();

    const group = await GroupFactory.create();

    await request
      .post(`/messages/group/${group.id}/media`)
      .attach("file", "test/assets/media.jpg")
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });

  test("[index] - should be able to list a group's message list", async (assert) => {
    const { token } = await generateToken();

    const groups = await generateGroups({ token, amount: 1 });
    let group = groups[0] as Group;

    group = await Group.findOrFail(group.id);

    const messages = (await generateMessages({
      group,
      amount: 100
    })) as Message[];

    const { body } = await request
      .get(`/messages/group/${group.id}?page=1&perPage=200`)
      .set("authorization", `bearer ${token}`)
      .expect(200);

    assert.exists(body.meta);
    assert.exists(body.data);
    assert.equal(body.meta.total, messages.length);
    assert.equal(messages.length, body.data.length);

    const memberships = await Database.query()
      .from("group_members")
      .where({ group_id: group.id });

    messages.forEach((message: Message) => {
      const isValid = body.data.some(
        (bodyMessage: Message) =>
          message.id === bodyMessage.id &&
          memberships.some(
            (membership) => membership.user_id === bodyMessage.userId
          )
      );

      assert.isTrue(isValid);
    });
  });

  test("[index] - should fail when trying to list a group's message list from a group you are not part of", async () => {
    const { token } = await generateToken();

    const group = await GroupFactory.create();

    await request
      .get(`/messages/group/${group.id}?page=1&perPage=20`)
      .set("authorization", `bearer ${token}`)
      .expect(400);
  });
});
