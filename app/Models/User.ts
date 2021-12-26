import { DateTime } from "luxon";
import Hash from "@ioc:Adonis/Core/Hash";
import {
  column,
  beforeSave,
  BaseModel,
  hasMany,
  HasMany,
  HasOne,
  hasOne,
  manyToMany,
  ManyToMany,
  computed
} from "@ioc:Adonis/Lucid/Orm";
import UserKey from "./UserKey";
import File from "./File";
import Group from "./Group";
import FriendshipRequest from "./FriendshipRequest";

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public email: string;

  @column({ serializeAs: null })
  public password: string;

  @column()
  public rememberMeToken?: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password);
    }
  }

  @hasMany(() => UserKey)
  public keys: HasMany<typeof UserKey>;

  @hasOne(() => File, {
    onQuery: (query) => {
      query.where({ fileCategory: "avatar" });
    }
  })
  public avatar: HasOne<typeof File>;

  @column()
  public name: string;

  @column()
  public username: string;

  @manyToMany(() => Group, {
    pivotTable: "group_members",
    pivotForeignKey: "user_id",
    pivotRelatedForeignKey: "group_id"
  })
  public groups: ManyToMany<typeof Group>;

  @manyToMany(() => User, {
    pivotTable: "friendships",
    pivotForeignKey: "user_id",
    pivotRelatedForeignKey: "friend_id"
  })
  public friends: ManyToMany<typeof User>;

  @manyToMany(() => User, {
    pivotTable: "friendship_requests",
    pivotForeignKey: "friend_id",
    pivotRelatedForeignKey: "user_id"
  })
  public pendingFriendshipRequests: ManyToMany<typeof User>;

  @hasMany(() => FriendshipRequest)
  public friendshipRequests: HasMany<typeof FriendshipRequest>;

  @computed()
  public get friendship() {
    return this.$extras.friendship;
  }

  @computed()
  public get existingConversation() {
    return this.$extras.existingConversation;
  }
}
