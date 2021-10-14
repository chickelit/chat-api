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

    const isBlocked = await Database.query()
      .from("user_blocks")
      .where({ user_id: userId, blocked_user_id: auth.user!.id })
      .orWhere({ user_id: auth.user!.id, blocked_user_id: userId })
      .first();

    const isFriend = await Database.query()
      .from("friendships")
      .where({ user_id: userId, friend_id: auth.user!.id })
      .first();

    if (isBlocked || !isFriend) {
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

    await group.load("members", (member) => {
      member.preload("avatar");
    });

    const members = await group
      .related("members")
      .query()
      .paginate(page, perPage);

    const queries = members.map(async (member) => {
      if (member.id !== user.id) {
        const blocked = await Database.query()
          .from("user_blocks")
          .where({
            user_id: member.id,
            blocked_user_id: user.id
          })
          .first();

        const isBlocked = await Database.query()
          .from("user_blocks")
          .where({
            user_id: user.id,
            blocked_user_id: member.id
          })
          .first();

        member.$extras.blocked = !!blocked;
        member.$extras.isBlocked = !!isBlocked;
      }

      await member.load("avatar");

      return member;
    });

    members.toJSON().data = await Promise.all(queries);

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
