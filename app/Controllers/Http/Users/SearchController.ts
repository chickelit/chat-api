import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Database from "@ioc:Adonis/Lucid/Database";
import { User } from "App/Models";

export default class MainController {
  public async show({ request, response, auth }: HttpContextContract) {
    const { username, page, perPage } = request.qs();

    if (!username || !page || !perPage) {
      return response.badRequest();
    }

    const users = (await User.query()
      .whereRaw(`username LIKE '%${username}%'`)
      .preload("avatar")
      .paginate(page, perPage)) as any;

    const queries = users.toJSON().data.map(async (user: User) => {
      const friendship = await Database.query()
        .from("friendships")
        .where({
          user_id: auth.user!.id,
          friend_id: user.id
        })
        .first();

      user.$extras.friendship = !!friendship;

      await user.load("avatar");

      if (user.id !== auth.user!.id) {
        return user;
      }
    });

    users.toJSON().data = await Promise.all(queries);

    return users;
  }
}
