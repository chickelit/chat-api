import { DateTime } from "luxon";
import {
  afterCreate,
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
  HasOne,
  hasOne
} from "@ioc:Adonis/Lucid/Orm";
import { Conversation, User, File, Group } from ".";
import { MessageCategory } from "App/utils";

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public userId: number;

  @column()
  public groupId: number;

  @column()
  public conversationId: number;

  @column()
  public category: MessageCategory;

  @column()
  public content: string;

  @column.dateTime({
    autoCreate: true,
    serialize: (value: DateTime) => {
      return value.toFormat("dd/MM/yyyy HH:mm:ss");
    }
  })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @belongsTo(() => User)
  public owner: BelongsTo<typeof User>;

  @belongsTo(() => Conversation)
  public conversation: BelongsTo<typeof Conversation>;

  @belongsTo(() => Group)
  public group: BelongsTo<typeof Group>;

  @hasOne(() => File, {
    onQuery: (query) => {
      query.where({ file_category: "media" });
    }
  })
  public media: HasOne<typeof File>;

  @afterCreate()
  public static async updateLatestMessageMoment(message: Message) {
    if (message.conversationId) {
      await message.load("conversation");

      await message.conversation
        .merge({
          latestMessageAt: new Date().toISOString()
        })
        .save();
    } else if (message.groupId) {
      await message.load("group");

      await message.group
        .merge({ latestMessageAt: new Date().toISOString() })
        .save();
    }
  }
}
