import { FriendshipRequest, User } from "App/Models";
import { UserFactory } from "Database/factories/UserFactory";

interface Payload {
  user: User;
  amount: number;
}

interface ReturningPayload {
  user: User;
  friendshipRequest: FriendshipRequest;
}

export default async ({ user, amount }: Payload) => {
  const queries = Array(amount)
    .fill(false)
    .map(async () => {
      const friend = await UserFactory.create();

      const friendshipRequest = await FriendshipRequest.create({
        userId: user.id,
        friendId: friend.id
      });

      return {
        friendshipRequest: {
          id: friendshipRequest.id,
          userId: friendshipRequest.userId,
          friendId: friendshipRequest.friendId,
          createdAt: friendshipRequest.createdAt,
          updatedAt: friendshipRequest.updatedAt
        } as FriendshipRequest,
        user: {
          id: friend.id,
          email: friend.email,
          name: friend.name,
          username: friend.username
        } as User
      };
    });

  const friendshipRequests = (await Promise.all(queries)) as ReturningPayload[];

  return friendshipRequests as ReturningPayload[];
};
