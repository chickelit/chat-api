import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { StoreValidator, UpdateValidator } from "App/Validators/Groups/Main";
import { Group, Message } from "App/Models";

export default class GroupsController {
  public async index({ request, response, auth }: HttpContextContract) {
    let { page, perPage } = request.qs();

    page = page ? page : 1;

    if (!perPage) {
      return response.badRequest();
    }

    const user = auth.user!;

    const groups = await user.related("groups").query().paginate(page, perPage);

    await user.load("groups", (group) => {
      group.preload("groupCover");
    });

    const queries = groups.map(async (group) => {
      await group.load("groupCover");

      const latestMessage = await Message.query()
        .where({ group_id: group.id })
        .orderBy("created_at", "desc")
        .first();

      if (latestMessage) {
        await latestMessage.load("owner");
      }

      if (latestMessage && latestMessage.category === "media") {
        await latestMessage.load("media");
      }

      group.$extras.latestMessage = latestMessage;

      return group;
    });

    groups.toJSON().data = await Promise.all(queries);

    return groups;
  }

  public async store({ request, auth }: HttpContextContract) {
    const { title } = await request.validate(StoreValidator);
    const user = auth.user!;

    const group = await Group.create({ title, userId: user.id });

    await group.related("members").attach([user.id]);

    return group;
  }

  public async show({ params, auth }: HttpContextContract) {
    const user = auth.user!;

    const group = await user
      .related("groups")
      .query()
      .where({ group_id: params.id })
      .firstOrFail();

    await group.load("members", (query) => {
      query.preload("avatar");
    });

    await group.load("messages", (query) => {
      query.preload("owner", (query) => {
        query.preload("avatar");
      });
    });

    const latestMessage = (await group
      .related("messages")
      .query()
      .orderBy("created_at", "desc")[0]) as Message;

    if (latestMessage) {
      await latestMessage.load("owner");
    }

    if (latestMessage && latestMessage.category === "media") {
      await latestMessage.load("media");
    }

    group.$extras.latestMessage = latestMessage;

    await group.load("groupCover");

    return group;
  }

  public async update({ request, response, auth }: HttpContextContract) {
    const { groupId, title } = await request.validate(UpdateValidator);
    const group = await Group.findOrFail(groupId);
    const user = auth.user!;

    if (group.userId !== user.id) {
      return response.badRequest();
    }

    group.merge({ title });
    await group.save();

    return group;
  }

  public async destroy({ response, params, auth }: HttpContextContract) {
    const group = await Group.findOrFail(params.id);
    const user = auth.user!;

    if (group.userId !== user.id) {
      return response.badRequest();
    }

    await group.delete();
  }
}
