import { User } from "App/Models";
import { request } from ".";

export default async (token: string, users: User[]) => {
  const queries = users.map(async (user) => {
    await request
      .post("/conversations")
      .send({ userId: user.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);
  });

  await Promise.all(queries);
};
