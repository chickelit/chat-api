import { request } from ".";
import faker from "faker";

export default async (
  token: string,
  quantity: number,
  conversationId?: number,
  groupId?: number
) => {
  if (conversationId) {
    const queries = Array(quantity)
      .fill(false)
      .map(async () => {
        const { body } = await request
          .post("/messages/conversation/text")
          .send({
            conversationId,
            content: faker.lorem.paragraph()
          })
          .set("authorization", `bearer ${token}`)
          .expect(200);

        return body;
      });

    const messages = await Promise.all(queries);

    return messages;
  }

  if (groupId) {
    const queries = Array(quantity)
      .fill(false)
      .map(async () => {
        const { body } = await request
          .post("/messages/group/text")
          .send({
            groupId,
            content: faker.lorem.paragraph()
          })
          .set("authorization", `bearer ${token}`)
          .expect(200);

        return body;
      });

    const messages = await Promise.all(queries);

    return messages;
  }

  return [];
};
