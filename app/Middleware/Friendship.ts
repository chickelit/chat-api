import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Database from "@ioc:Adonis/Lucid/Database";
import { StoreValidator } from "App/Validators/Groups/Members";

export default class Friendship {
  public async handle(
    { request, response, auth }: HttpContextContract,
    next: () => Promise<void>
  ) {
    const { userId } = await request.validate(StoreValidator);

    const areFriends = ![
      await Database.query()
        .from("friendships")
        .where({ user_id: auth.user!.id, friend_id: userId })
        .first(),
      await Database.query()
        .from("friendships")
        .where({ user_id: userId, friend_id: auth.user!.id })
        .first()
    ].some((friendship) => friendship === null);

    if (!areFriends) {
      return response.unauthorized();
    }

    await next();
  }
}
