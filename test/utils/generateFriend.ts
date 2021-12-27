import { User } from "App/Models";
import { generateToken, request } from ".";

export default async (user: User, token: string) => {
  const { user: friend, token: friendToken } = await generateToken();

  await request
    .post("/friendships/requests")
    .send({ userId: friend.id })
    .set("authorization", `bearer ${token}`)
    .expect(200);

  await request
    .post("/friendships")
    .send({ userId: user.id })
    .set("authorization", `bearer ${friendToken}`)
    .expect(200);

  return {
    friend: {
      id: friend.id,
      email: friend.email,
      name: friend.name,
      username: friend.username
    },
    friendToken
  };
};
