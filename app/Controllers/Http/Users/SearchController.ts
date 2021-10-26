import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Database from "@ioc:Adonis/Lucid/Database";
import { User } from "App/Models";

export default class MainController {
  public async show({ request, response, auth }: HttpContextContract) {
    const { username } = request.qs();

    if (!username) {
      return response.badRequest();
    }

    const user = await User.findByOrFail("userName", username);

    const friendship = await Database.query()
      .from("friendships")
      .where({
        user_id: auth.user!.id,
        friend_id: user.id
      })
      .first();

    user.$extras.friendship = !!friendship;

    await user.load("avatar");

    return user;
  }
}
