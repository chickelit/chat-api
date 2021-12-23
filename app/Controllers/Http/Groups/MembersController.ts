import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Database from "@ioc:Adonis/Lucid/Database";
import { Group, User } from "App/Models";
import Ws from "App/Services/Ws";
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

    const member = await User.findOrFail(userId);
    await member.load("avatar");

    Ws.io.to(`group-${groupId}`).emit("newMember", {
      groupId,
      user: {
        groupId,
        id: member.id,
        name: member.name,
        username: member.username,
        avatar: member.avatar
      }
    });

    await group.load("owner", (owner) => {
      owner.preload("avatar");
    });

    await group.load("groupCover");

    const latestMessage = await group
      .related("messages")
      .query()
      .orderBy("created_at", "desc")
      .first();

    const user = auth.user!;

    Ws.io.to(`user-${userId}`).emit("newGroup", {
      group: {
        id: group.id,
        title: group.title,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        owner: group.owner,
        groupCover: group.groupCover,
        latestMessage: latestMessage
      },
      user: {
        id: user.id,
        username: user.username
      }
    });
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

    Ws.io.to(`group-${groupId}`).emit("deleteMember", { memberId: +userId });

    Ws.io.to(`user-${userId}`).emit(`deleteGroup`, { groupId: +groupId });
  }
}
