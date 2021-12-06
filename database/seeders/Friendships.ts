import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
import { Friendship, User } from "App/Models";

export default class FriendshipsSeeder extends BaseSeeder {
  public async run() {
    const users = await User.query();
    const me = users.find((user) => user.username === "me");

    const queries = users
      .filter((user) => user.username !== "me")
      .map(async (user) => {
        await Friendship.create({ userId: me?.id, friendId: user.id });
        await Friendship.create({ userId: user.id, friendId: me?.id });
      });

    await Promise.all(queries);
  }
}
