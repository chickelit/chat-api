import { Conversation, Group, Message } from "App/Models";
import faker from "faker";

interface Payload {
  conversation?: Conversation;
  group?: Group;
  amount: number;
}

export default async ({ conversation, group, amount }: Payload) => {
  if (conversation) {
    const queries = Array(amount)
      .fill(false)
      .map(async () => {
        const randomId =
          Math.round(Math.random()) === 1
            ? conversation.userIdOne
            : conversation.userIdTwo;

        const message = await Message.create({
          category: "text",
          content: faker.lorem.paragraph(),
          conversationId: conversation.id,
          userId: randomId
        });

        return message;
      });

    const messages = await Promise.all(queries);

    return messages;
  } else if (group) {
    const queries = Array(amount)
      .fill(false)
      .map(async () => {
        const members = await group.related("members").query();
        const randomMemberIndex = Math.round(
          Math.random() * (members.length - 1)
        );
        const randomMember = members[randomMemberIndex];

        await Message.create({
          category: "text",
          content: faker.lorem.paragraph(),
          groupId: group.id,
          userId: randomMember.id
        });
      });

    const messages = await Promise.all(queries);

    return messages;
  }
};
