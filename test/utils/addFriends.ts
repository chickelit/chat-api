import { User } from "App/Models";
import { request, sendFriendshipRequests } from ".";

interface UserWithToken {
  user: User;
  token: string;
}

export default async (
  userWithToken: UserWithToken,
  friendsWithToken: UserWithToken[]
) => {
  const queries = friendsWithToken.map(async (friendWithToken) => {
    await sendFriendshipRequests(userWithToken.user.id, [
      friendWithToken.token
    ]);

    await request
      .post("/friendships")
      .send({
        userId: friendWithToken.user.id
      })
      .set("authorization", `bearer ${userWithToken.token}`)
      .expect(200);
  });

  await Promise.all(queries);
};
