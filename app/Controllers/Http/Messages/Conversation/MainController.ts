import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Database from "@ioc:Adonis/Lucid/Database";
import { Conversation, Message } from "App/Models";
import { StoreValidator } from "App/Validators/Message/Private/Text";

export default class MainController {
  public async index({ request, response, params, auth }: HttpContextContract) {
    let { page, perPage } = request.qs();

    page = page ? page : 1;

    if (!perPage) {
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
    const user = auth.user!;

    const conversation = await Conversation.findOrFail(conversationId);

    if (
      !(conversation.userIdOne === user.id) &&
      !(conversation.userIdTwo === user.id)
    ) {
      return response.badRequest();
    }

    const isBlocked = await Database.query()
      .from("user_blocks")
      .where({
        user_id: conversation.userIdOne,
        blocked_user_id: conversation.userIdTwo
      })
      .orWhere({
        user_id: conversation.userIdTwo,
        blocked_user_id: conversation.userIdOne
      })
      .first();

    const friendship = await Database.query()
      .from("friendships")
      .where({
        user_id: conversation.userIdOne,
        friend_id: conversation.userIdTwo
      })
      .first();

    if (!friendship) {
      return response.badRequest();
    }

    if (isBlocked) {
      return response.badRequest();
    }

    const message = await conversation
      .related("messages")
      .create({ userId: auth.user!.id, category: "text", content });

    return message;
  }
}
