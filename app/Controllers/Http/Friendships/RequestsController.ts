import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Database from "@ioc:Adonis/Lucid/Database";
import { StoreValidator } from "App/Validators/FriendshipRequests";

export default class RequestsController {
  public async index({ request, response, auth }: HttpContextContract) {
    let { page, perPage } = request.qs();

    page = page ? 1 : page;

    if (!perPage) {
      return response.badRequest();
    }

    const user = auth.user!;

    const pendingFriendshipRequests = await user
      .related("pendingFriendshipRequests")
      .query()
      .preload("avatar")
      .paginate(page, perPage);

    return pendingFriendshipRequests;
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const { userId } = await request.validate(StoreValidator);
    const user = auth.user!;

    if (user.id === userId) {
      return response.badRequest();
    }

    const condition = [
      await Database.query()
        .from("friendships")
        .where({ user_id: user.id, friend_id: userId })
        .first(),
      await Database.query()
        .from("friendship_requests")
        .where({ user_id: user.id, friend_id: userId })
        .first(),
      await Database.query()
        .from("friendship_requests")
        .where({ user_id: userId, friend_id: user.id })
        .first()
    ].some((condition) => condition);

    if (condition) {
      return response.badRequest();
    }

    await user.related("friendshipRequests").create({
      friendId: userId
    });
  }

  public async destroy({ response, params, auth }: HttpContextContract) {
    const user = auth.user!;

    if (auth.user!.id === +params.id) {
      return response.badRequest();
    }

    const friendshipRequest = await user
      .related("pendingFriendshipRequests")
      .query()
      .where({ user_id: params.id })
      .first();

    if (!friendshipRequest) {
      return response.badRequest();
    }

    await user.related("pendingFriendshipRequests").detach([params.id]);
  }
}
