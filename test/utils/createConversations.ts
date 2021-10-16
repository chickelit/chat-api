import { User } from "App/Models";
import { request } from ".";

export default async (token: string, users: User[]) => {
  const queries = users.map(async (user) => {
    const { body } = await request
      .post("/conversations")
      .send({ userId: user.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    return body;
  });

  return await Promise.all(queries);
};
