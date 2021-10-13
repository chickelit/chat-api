import { User } from "App/Models";
import { request } from ".";

export default async (token: string, blockedUsers: User[]) => {
  const queries = blockedUsers.map(async (blockedUser) => {
    await request
      .post("/users/blocks")
      .send({ userId: blockedUser.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    return blockedUser;
  });

  const users = await Promise.all(queries);

  return users;
};
