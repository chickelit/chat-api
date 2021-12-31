import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
import { Conversation, User } from "App/Models";

export default class ConversationsSeeder extends BaseSeeder {
  public async run() {
    const users = await User.query();
    const me = users.find((user) => user.username === "me");

    let counter = 0;

    const queries = users
      .filter((user) => user.username !== "me")
      .map(async (user) => {
        counter += 1000;

        await Conversation.create({
          userIdOne: me?.id,
          userIdTwo: user.id,
          latestMessageAt: new Date(
            new Date().getTime() + counter
          ).toISOString()
        });
      });

    await Promise.all(queries);
  }
}
