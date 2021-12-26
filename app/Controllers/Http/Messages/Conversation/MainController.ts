import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Database from "@ioc:Adonis/Lucid/Database";
import { Conversation, Message } from "App/Models";
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
    const { content, conversationId } = await request.validate(StoreValidator);

    const conversation = await Conversation.findOrFail(conversationId);

    if (
      ![conversation.userIdOne, conversation.userIdTwo].includes(auth.user!.id)
    ) {
      return response.badRequest();
    }

    const friendship = [
      await Database.query()
        .from("friendships")
        .where({
          user_id: conversation.userIdOne,
          friend_id: conversation.userIdTwo
        })
        .first(),
      await Database.query()
        .from("friendships")
        .where({
          user_id: conversation.userIdTwo,
          friend_id: conversation.userIdOne
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

    const message = await conversation
      .related("messages")
      .create({ userId: auth.user!.id, category: "text", content });

    return message;
  }
}
