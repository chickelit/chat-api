import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
import { User } from "App/Models";
import { GroupFactory } from "Database/factories/GroupFactory";

export default class GroupsSeeder extends BaseSeeder {
  public async run() {
    const me = await User.findByOrFail("email", "me@gmail.com");

    const groups = await GroupFactory.merge({ userId: me.id }).createMany(60);

    const queries = groups.map(async (group) => {
      await group.related("members").attach([me.id]);
    });

    await Promise.all(queries);
  }
}
