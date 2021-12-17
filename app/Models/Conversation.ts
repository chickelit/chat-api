import { DateTime } from "luxon";
import {
  afterCreate,
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
  computed,
  HasMany,
  hasMany
} from "@ioc:Adonis/Lucid/Orm";
import { User, Message } from "./index";
import Ws from "App/Services/Ws";

export default class Conversation extends BaseModel {
  public static table = "conversations";

  @column({ isPrimary: true })
  public id: number;

  @column()
  public userIdOne: number;

  @column()
  public userIdTwo: number;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @belongsTo(() => User, {
    foreignKey: "userIdOne"
  })
  public userOne: BelongsTo<typeof User>;

  @belongsTo(() => User, {
    foreignKey: "userIdTwo"
  })
  public userTwo: BelongsTo<typeof User>;

  @hasMany(() => Message, {
    onQuery: (query) => {
      query.whereNotNull("conversation_id");
      query.whereNull("group_id");
    }
  })
  public messages: HasMany<typeof Message>;

  @computed()
  public get latestMessage() {
    return this.$extras.latestMessage;
  }

  @computed()
  public get user() {
    return this.$extras.user;
  }

  @computed()
  public get friendship() {
    return this.$extras.friendship;
  }

  @afterCreate()
  public static async sendConversation(conversation: Conversation) {
    await conversation.load("userOne", (conversation) => {
      conversation.preload("avatar");
    });
    await conversation.load("userTwo", (conversation) => {
      conversation.preload("avatar");
    });

    const { userOne, userTwo } = conversation;

    const userOneConversation = {
      id: conversation.id,
      userIdOne: conversation.userIdOne,
      userIdTwo: conversation.userIdTwo,
      user: userTwo
    };

    const useTwoConversation = {
      id: conversation.id,
      userIdOne: conversation.userIdOne,
      userIdTwo: conversation.userIdTwo,
      user: userOne
    };

    Ws.io.to(`user-${userOne.id}`).emit("newConversation", userOneConversation);

    Ws.io.to(`user-${userTwo.id}`).emit("newConversation", useTwoConversation);
  }
}
