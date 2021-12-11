import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
import User from "App/Models/User";
import { UserFactory } from "Database/factories/UserFactory";

export default class UserSeeder extends BaseSeeder {
  public async run() {
    await UserFactory.merge({ password: "secret" }).createMany(120);
    await User.create({
      email: "me@gmail.com",
      password: "secret",
      name: "me",
      username: "me"
    });
  }
}
