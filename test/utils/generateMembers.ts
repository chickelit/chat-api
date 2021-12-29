import { Group, User } from "App/Models";
import { generateFriend, request } from ".";

interface Payload {
  group: Group;
  user: User;
  token: string;
  amount: number;
}

export default async ({ group, user, token, amount }: Payload) => {
  const queries = Array(amount)
    .fill(false)
    .map(async () => {
      const { friend } = await generateFriend({ user });

      await request
        .post("/members")
        .send({
          userId: friend.id,
          groupId: group.id
        })
        .set("authorization", `bearer ${token}`)
        .expect(200);

      return friend;
    });

  const members = await Promise.all(queries);

  return {
    members,
    group
  };
};
