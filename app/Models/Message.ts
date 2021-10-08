import { DateTime } from "luxon";
import {
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
  HasOne,
  hasOne
} from "@ioc:Adonis/Lucid/Orm";
import { Conversation, User, File } from ".";
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
      return value.toFormat("dd/MM/yyyy hh:mm:ss");
    }
  })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @belongsTo(() => User)
  public owner: BelongsTo<typeof User>;

  @belongsTo(() => Conversation)
  public conversation: BelongsTo<typeof Conversation>;

  @hasOne(() => File, {
    onQuery: (query) => {
      query.where({ file_category: "media" });
    }
  })
  public media: HasOne<typeof File>;
}
