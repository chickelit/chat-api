import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { Conversation } from "App/Models";
import { StoreValidator } from "App/Validators/Message/Private/Media";
import Application from "@ioc:Adonis/Core/Application";
import Database from "@ioc:Adonis/Lucid/Database";
import Ws from "App/Services/Ws";

export default class MediaController {
  public async store({ request, response, params, auth }: HttpContextContract) {
    const { file } = await request.validate(StoreValidator);
    const user = auth.user!;

    const existingConversation = await Conversation.query()
      .where({
        userIdOne: auth.user!.id,
        userIdTwo: +params.receiverId
      })
      .orWhere({
        userIdOne: +params.receiverId,
        userIdTwo: auth.user!.id
      })
      .first();

    const friendship = [
      await Database.query()
        .from("friendships")
        .where({
          user_id: auth.user!.id,
          friend_id: +params.receiverId
        })
        .first(),
      await Database.query()
        .from("friendships")
        .where({
          user_id: +params.receiverId,
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
        .create({ userId: user.id, category: "media" });

      const mediaFile = await message.related("media").create({
        fileCategory: "media",
        fileName: `${new Date().getTime()}.${file.extname}`
      });

      await file.move(Application.tmpPath("uploads"), {
        name: mediaFile.fileName,
        overwrite: true
      });

      await message.load("owner", (owner) => {
        owner.preload("avatar");
      });

      await message.load("media");

      Ws.io.to(`conversation-${message.conversationId}`).emit("newMessage", {
        id: message.id,
        userId: message.userId,
        conversationId: message.conversationId,
        category: message.category,
        createdAt: message.createdAt.toFormat("dd/MM/yyyy HH:mm:ss"),
        updatedAt: message.updatedAt,
        media: message.media,
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
        userIdTwo: +params.receiverId
      });

      const message = await conversation
        .related("messages")
        .create({ userId: user.id, category: "media" });

      const mediaFile = await message.related("media").create({
        fileCategory: "media",
        fileName: `${new Date().getTime()}.${file.extname}`
      });

      await file.move(Application.tmpPath("uploads"), {
        name: mediaFile.fileName,
        overwrite: true
      });

      await message.load("owner", (owner) => {
        owner.preload("avatar");
      });

      await message.load("media");

      Ws.io.to(`conversation-${message.conversationId}`).emit("newMessage", {
        id: message.id,
        userId: message.userId,
        conversationId: message.conversationId,
        category: message.category,
        createdAt: message.createdAt.toFormat("dd/MM/yyyy HH:mm:ss"),
        updatedAt: message.updatedAt,
        media: message.media,
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
