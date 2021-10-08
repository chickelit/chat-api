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

    const blocked = await Database.query()
      .from("user_blocks")
      .where({
        user_id: user.id,
        blocked_user_id: auth.user!.id
      })
      .first();

    const isBlocked = await Database.query()
      .from("user_blocks")
      .where({
        user_id: auth.user!.id,
        blocked_user_id: user.id
      })
      .first();

    user.$extras.blocked = !!blocked;
    user.$extras.isBlocked = !!isBlocked;

    await user.load("avatar");

    return user;
  }
}
