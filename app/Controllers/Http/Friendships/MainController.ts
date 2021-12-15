import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Database from "@ioc:Adonis/Lucid/Database";
import { User } from "App/Models";
import Ws from "App/Services/Ws";
import { StoreValidator } from "App/Validators/Friendships";

export default class MainController {
  public async index({ request, response, auth }: HttpContextContract) {
    let { page, perPage } = request.qs();

    page = page ? page : 1;

    if (!perPage) {
      return response.badRequest();
    }

    const user = auth.user!;

    const friends = await user
      .related("friends")
      .query()
      .paginate(page, perPage);

    const queries = friends.map(async (friend) => {
      await friend.load("avatar");

      return friend;
    });

    friends.toJSON().data = await Promise.all(queries);

    return friends;
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const { userId } = await request.validate(StoreValidator);
    const user = auth.user!;

    if (userId === user.id) {
      return response.badRequest();
    }

    const pendingFriendshipRequest = await user
      .related("pendingFriendshipRequests")
      .query()
      .where({ user_id: userId })
      .first();

    if (!pendingFriendshipRequest) {
      return response.badRequest();
    }

    const friend = await User.findOrFail(userId);

    await user.related("friends").attach([userId]);
    await friend.related("friends").attach([user.id]);

    await friend.load("avatar");
    await user.load("avatar");

    Ws.io.to(`user-${user.id}`).emit("newFriend", {
      id: friend.id,
      name: friend.name,
      username: friend.username,
      avatar: friend.avatar
    });

    Ws.io.to(`user-${friend.id}`).emit("newFriend", {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar
    });

    Ws.io.to(`user-${friend.id}`).emit("friendshipRequestAccepted", {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar
    });

    await user.related("pendingFriendshipRequests").detach([userId]);

    return friend;
  }

  public async destroy({ response, params, auth }: HttpContextContract) {
    const user = auth.user!;

    if (user.id === +params.id) {
      return response.badRequest();
    }

    const friendship = [
      await Database.query()
        .from("friendships")
        .where({ user_id: user.id, friend_id: +params.id })
        .first(),
      await Database.query()
        .from("friendships")
        .where({ user_id: +params.id, friend_id: user.id })
        .first()
    ].every((condition) => condition);

    if (!friendship) {
      return response.badRequest();
    }

    const friend = await User.findOrFail(params.id);

    await user.related("friends").detach([friend.id]);
    await friend.related("friends").detach([user.id]);
  }
}
