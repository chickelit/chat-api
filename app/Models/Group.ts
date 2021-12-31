import { DateTime } from "luxon";
import {
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
  computed,
  HasMany,
  hasMany,
  HasOne,
  hasOne,
  ManyToMany,
  manyToMany
} from "@ioc:Adonis/Lucid/Orm";
import { Message, User, File } from ".";

export default class Group extends BaseModel {
  public static table = "groups";

  @column({ isPrimary: true })
  public id: number;

  @column()
  public userId: number;

  @column()
  public title: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column()
  public latestMessageAt: string;

  @manyToMany(() => User, {
    pivotTable: "group_members",
    pivotForeignKey: "group_id",
    pivotRelatedForeignKey: "user_id"
  })
  public members: ManyToMany<typeof User>;

  @hasOne(() => File, {
    onQuery: (query) => {
      query.where({ fileCategory: "groupCover" });
    }
  })
  public groupCover: HasOne<typeof File>;

  @hasMany(() => Message, {
    onQuery: (query) => {
      query.whereNotNull("group_id");
      query.whereNull("conversation_id");
    }
  })
  public messages: HasMany<typeof Message>;

  @belongsTo(() => User)
  public owner: BelongsTo<typeof User>;

  @computed()
  public get latestMessage() {
    return this.$extras.latestMessage;
  }

  @computed()
  public get isOwner() {
    return this.$extras.isOwner;
  }
}
