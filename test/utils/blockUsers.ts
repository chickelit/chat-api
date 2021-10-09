import { User } from "App/Models";
import { request } from ".";

export default async (token: string, users: User[]) => {
  const queries = users.map(async (blockedUser) => {
    await request
      .post("/users/blocks")
      .send({ userId: blockedUser.id })
      .set("authorization", `bearer ${token}`)
      .expect(200);

    return blockedUser;
  });

  const blockedUsers = await Promise.all(queries);

  return blockedUsers;
};
