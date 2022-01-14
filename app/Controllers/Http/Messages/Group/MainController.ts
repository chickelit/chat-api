import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { Group, Message } from "App/Models";
import Ws from "App/Services/Ws";
import { StoreValidator } from "App/Validators/Message/Group/Text";

export default class MainController {
  public async index({ request, response, params, auth }: HttpContextContract) {
    let { page, perPage } = request.qs();

    if (!page || !perPage) {
      return response.badRequest();
    }

    const group = await Group.findOrFail(params.id);

    await group.load("members");

    if (!group.members.some((member) => member.id === auth.user!.id)) {
      return response.badRequest();
    }

    const messages = await Message.query()
      .where({ groupId: params.id })
      .paginate(page, perPage);

    const queries = messages.toJSON().data.map(async (message: Message) => {
      await message.load("owner", (owner) => {
        owner.preload("avatar");
      });

      if (message.category === "media") {
        await message.load("media");
      }

      return message;
    });

    messages.toJSON().data = await Promise.all(queries);
    messages
      .toJSON()
      .data.sort((messageOne: Message, messageTwo: Message) =>
        messageOne.createdAt > messageTwo.createdAt ? 1 : -1
      );

    return messages;
  }
  public async store({ request, response, auth }: HttpContextContract) {
    const { content, groupId } = await request.validate(StoreValidator);
    const user = auth.user!;

    const group = await Group.findOrFail(groupId);
    await group.load("members");

    const isMember = group.members.some((member) => member.id === user.id);

    if (!isMember) {
      return response.badRequest();
    }

    const message = await group
      .related("messages")
      .create({ userId: user.id, category: "text", content });

    Ws.io.to(`group-${groupId}`).emit("newMessage", {
      id: message.id,
      userId: message.userId,
      groupId: message.groupId,
      content: message.content,
      category: message.category,
      createdAt: message.createdAt.toFormat("dd/MM/yyyy HH:mm:ss"),
      updatedAt: message.updatedAt,
      owner: {
        id: message.owner.id,
        email: message.owner.email,
        name: message.owner.name,
        username: message.owner.username,
        avatar: message.owner.avatar
      }
    });
    return message;
  }
}
