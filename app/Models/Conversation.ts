import { DateTime } from "luxon";
import {
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
  computed,
  HasMany,
  hasMany
} from "@ioc:Adonis/Lucid/Orm";
import { User, Message } from "./index";

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

  @column.dateTime({ autoCreate: true })
  public latestMessageAt: DateTime;

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
}
