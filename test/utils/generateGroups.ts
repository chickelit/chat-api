import { Group } from "App/Models";
import { request } from ".";
import faker from "faker";

interface Payload {
  token: string;
  amount: number;
}

export default async ({ token, amount }: Payload) => {
  const queries = Array(amount)
    .fill(false)
    .map(async () => {
      const { body } = await request
        .post("/groups")
        .send({
          title: faker.lorem.words(2)
        })
        .set("Authorization", `bearer ${token}`)
        .expect(200);

      return {
        id: body.id,
        userId: body.userId,
        title: body.title
      };
    });

  const groups = await Promise.all(queries);

  return groups as Group[];
};
