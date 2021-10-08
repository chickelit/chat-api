import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Database from "@ioc:Adonis/Lucid/Database";
import { User } from "App/Models";
import { StoreValidator } from "App/Validators/Users/Blocks";

export default class MainsController {
  public async index({ auth }: HttpContextContract) {
    const user = auth.user!;

    await user.load("blockedUsers", (query) => {
      query.preload("avatar");
    });

    const blockedUsers = user.blockedUsers;

    return blockedUsers;
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const { userId } = await request.validate(StoreValidator);
    const user = auth.user!;

    if (userId === auth.user!.id) {
      return response.badRequest();
    }

    const condition = [
      await Database.query()
        .from("user_blocks")
        .where({ user_id: user.id, blocked_user_id: userId })
        .first(),
      await Database.query()
        .from("user_blocks")
        .where({ user_id: userId, blocked_user_id: user.id })
        .first()
    ].some((condition) => condition);

    if (condition) {
      return response.badRequest();
    }

    await user.related("blockedUsers").attach([userId]);

    const blockedUser = await User.findOrFail(userId);

    await user.related("friends").detach([userId]);
    await blockedUser.related("friends").detach([user.id]);
  }

  public async destroy({ response, params, auth }: HttpContextContract) {
    const user = auth.user!;

    if (user.id === +params.id) {
      return response.badRequest();
    }

    await user.related("blockedUsers").detach([params.id]);
  }
}
