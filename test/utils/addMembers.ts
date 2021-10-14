import { User } from "App/Models";
import { request } from ".";

interface UserWithToken {
  user: User;
  token: string;
}

export default async (
  groupId: Number,
  userWithToken: UserWithToken,
  friendsWithToken: UserWithToken[]
) => {
  const queries = friendsWithToken.map(async (friendWithToken) => {
    await request
      .post("/members")
      .send({
        groupId: groupId,
        userId: friendWithToken.user.id
      })
      .set("authorization", `bearer ${userWithToken.token}`)
      .expect(200);
  });

  await Promise.all(queries);
};
