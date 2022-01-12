import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Database from "@ioc:Adonis/Lucid/Database";
import { Conversation, Message } from "App/Models";
import Ws from "App/Services/Ws";
import { StoreValidator } from "App/Validators/Message/Private/Text";

export default class MainController {
  public async index({ request, response, params, auth }: HttpContextContract) {
    let { page, perPage } = request.qs();

    if (!page || !perPage) {
      return response.badRequest();
    }

    const conversation = await Conversation.findOrFail(params.id);

    if (
      ![conversation.userIdOne, conversation.userIdTwo].includes(auth.user!.id)
    ) {
      return response.badRequest();
    }

    const messages = await Message.query()
      .where({ conversationId: params.id })
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

    return messages;
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const { content, receiverId } = await request.validate(StoreValidator);

    const existingConversation = await Conversation.query()
      .where({
        userIdOne: auth.user!.id,
        userIdTwo: receiverId
      })
      .orWhere({
        userIdOne: receiverId,
        userIdTwo: auth.user!.id
      })
      .first();

    const friendship = [
      await Database.query()
        .from("friendships")
        .where({
          user_id: auth.user!.id,
          friend_id: receiverId
        })
        .first(),
      await Database.query()
        .from("friendships")
        .where({
          user_id: receiverId,
          friend_id: auth.user!.id
        })
        .first()
    ].every((condition) => condition);

    if (!friendship) {
      return response.status(400).json({
        errors: [
          {
            rule: "exists",
            target: "friendship"
          }
        ]
      });
    }

    if (existingConversation) {
      const message = await existingConversation
        .related("messages")
        .create({ userId: auth.user!.id, category: "text", content });

      await message.load("owner", (owner) => {
        owner.preload("avatar");
      });

      Ws.io.to(`conversation-${message.conversationId}`).emit("newMessage", {
        id: message.id,
        userId: message.userId,
        conversationId: message.conversationId,
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
    } else {
      const conversation = await Conversation.create({
        userIdOne: auth.user!.id,
        userIdTwo: receiverId
      });

      const message = await conversation
        .related("messages")
        .create({ userId: auth.user!.id, category: "text", content });

      await message.load("owner", (owner) => {
        owner.preload("avatar");
      });

      Ws.io.to(`conversation-${message.conversationId}`).emit("newMessage", {
        id: message.id,
        userId: message.userId,
        conversationId: message.conversationId,
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
}
