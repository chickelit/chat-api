import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Database from "@ioc:Adonis/Lucid/Database";
import { Group } from "App/Models";
import { StoreValidator } from "App/Validators/Groups/Members";

export default class MembersController {
  public async store({ request, response, auth }: HttpContextContract) {
    const { groupId, userId } = await request.validate(StoreValidator);
    const group = await Group.findOrFail(groupId);

    if (userId === auth.user!.id) {
      return response.badRequest();
    }

    if (group.userId !== auth.user!.id) {
      return response.badRequest();
    }

    const friendship = [
      await Database.query()
        .from("friendships")
        .where({ user_id: userId, friend_id: auth.user!.id })
        .first(),
      await Database.query()
        .from("friendships")
        .where({ user_id: userId, friend_id: auth.user!.id })
        .first()
    ].every((condition) => condition);

    if (!friendship) {
      return response.badRequest();
    }

    await group.load("members");

    const alreadyMember = group.members.some((member) => member.id === userId);

    if (alreadyMember) {
      return response.badRequest();
    }

    await group.related("members").attach([userId]);
  }

  public async index({ request, response, params, auth }: HttpContextContract) {
    let { page, perPage } = request.qs();

    page = page ? page : 1;

    if (!perPage) {
      return response.badRequest();
    }

    const user = auth.user!;
    const group = await user
      .related("groups")
      .query()
      .where({
        group_id: +params.id
      })
      .firstOrFail();

    const members = await group
      .related("members")
      .query()
      .preload("avatar")
      .paginate(page, perPage);

    return members;
  }

  public async destroy({ request, response, auth }: HttpContextContract) {
    const { groupId, userId } = request.qs();

    if (!groupId || !userId) {
      return response.badRequest();
    }

    const group = await Group.findOrFail(groupId);

    await group.load("members");

    if (!group.members.some((member) => member.id === +userId)) {
      return response.badRequest();
    }

    if (group.userId === auth.user!.id) {
      if (auth.user!.id === +userId) {
        return response.badRequest();
      }

      await group.related("members").detach([+userId]);
    }

    if (+userId === auth.user!.id) {
      await group.related("members").detach([+userId]);
    }
  }
}
