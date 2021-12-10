import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
import { User } from "App/Models";
import { UserFactory } from "Database/factories/UserFactory";

export default class FriendshipRequestsSeeder extends BaseSeeder {
  public async run() {
    const users = await UserFactory.createMany(60);
    const me = await User.findByOrFail("email", "me@gmail.com");

    await me
      .related("pendingFriendshipRequests")
      .attach(users.map((user) => user.id));
  }
}
