import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
import { User } from "App/Models";

export default class FriendshipsSeeder extends BaseSeeder {
  public async run() {
    const users = await User.query();
    const me = await User.findByOrFail("email", "me@gmail.com");

    const queries = users
      .filter((user) => user.username !== "me")
      .map(async (user) => {
        await user.related("friends").attach([me.id]);
        await me.related("friends").attach([user.id]);
      });

    await Promise.all(queries);
  }
}
