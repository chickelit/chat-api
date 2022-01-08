import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { Friendship, FriendshipRequest, User } from "App/Models";

export default class MainController {
  public async show({ request, response, auth }: HttpContextContract) {
    const { username, page, perPage } = request.qs();

    if (!username || !page || !perPage) {
      return response.badRequest();
    }

    const users = (await User.query()
      .whereRaw(`username LIKE '%${username}%'`)
      .whereNot({ id: auth.user!.id })
      .preload("avatar")
      .paginate(page, perPage)) as any;

    const queries = users.toJSON().data.map(async (user: User) => {
      const friendship = [
        await Friendship.query()
          .where({
            userId: auth.user!.id,
            friendId: user.id
          })
          .first(),
        await Friendship.query()
          .where({
            userId: user.id,
            friendId: auth.user!.id
          })
          .first()
      ].every((condition) => condition);

      const friendshipRequest = await FriendshipRequest.query()
        .where({
          userId: auth.user!.id,
          friendId: user.id
        })
        .orWhere({
          userId: user.id,
          friendId: auth.user!.id
        })
        .first();

      user.$extras.friendship = !!friendship;
      user.$extras.friendshipRequest = !!friendshipRequest;

      await user.load("avatar");

      if (user.id !== auth.user!.id) {
        return user;
      }
    });

    users.toJSON().data = await Promise.all(queries);

    return users;
  }
}
