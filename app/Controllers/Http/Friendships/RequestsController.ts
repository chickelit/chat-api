import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Database from "@ioc:Adonis/Lucid/Database";
import { User } from "App/Models";
import Ws from "App/Services/Ws";
import { StoreValidator } from "App/Validators/FriendshipRequests";

export default class RequestsController {
  public async index({ request, response, auth }: HttpContextContract) {
    let { page, perPage } = request.qs();

    if (!page || !perPage) {
      return response.badRequest();
    }

    const user = auth.user!;

    const pendingFriendshipRequests = await user
      .related("pendingFriendshipRequests")
      .query()
      .orderBy("created_at", "asc")
      .preload("avatar")
      .paginate(page, perPage);

    return pendingFriendshipRequests;
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const { userId } = await request.validate(StoreValidator);
    const newFriend = await User.findOrFail(userId);
    const user = auth.user!;

    if (user.id === userId) {
      return response.badRequest();
    }

    const existingFriendshipRequest = [
      await Database.query()
        .from("friendship_requests")
        .where({ user_id: user.id, friend_id: newFriend.id })
        .first(),
      await Database.query()
        .from("friendship_requests")
        .where({ user_id: newFriend.id, friend_id: user.id })
        .first()
    ].some((condition) => condition);

    const existingFriendship = [
      await Database.query()
        .from("friendships")
        .where({ user_id: user.id, friend_id: newFriend.id })
        .first(),
      await Database.query()
        .from("friendships")
        .where({ user_id: newFriend.id, friend_id: user.id })
        .first()
    ].every((condition) => condition);

    if (existingFriendshipRequest) {
      return response.status(400).json({
        errors: [
          {
            rule: "unique",
            target: "friendship-request"
          }
        ]
      });
    }

    if (existingFriendship) {
      return response.status(400).json({
        errors: [
          {
            rule: "unique",
            target: "friendship"
          }
        ]
      });
    }

    newFriend.related("pendingFriendshipRequests").attach([user.id]);

    Ws.io.to(`user-${newFriend.id}`).emit("newFriendshipRequest", {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      avatar: user.avatar
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
