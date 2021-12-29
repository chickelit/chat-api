import { Friendship, User } from "App/Models";
import { UserFactory } from "Database/factories/UserFactory";
import { authenticate } from ".";

interface Payload {
  user: User;
}

export default async ({ user }: Payload) => {
  const friend = await UserFactory.merge({ password: "secret" }).create();

  await Friendship.create({
    userId: user.id,
    friendId: friend.id
  });
  await Friendship.create({
    userId: friend.id,
    friendId: user.id
  });

  const { token: friendToken } = await authenticate({
    email: friend.email,
    password: "secret"
  });

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
