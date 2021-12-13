import { DateTime } from "luxon";
import {
  afterCreate,
  BaseModel,
  BelongsTo,
  belongsTo,
  column
} from "@ioc:Adonis/Lucid/Orm";
import User from "./User";
import Ws from "App/Services/Ws";

export default class FriendshipRequest extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public userId: number;

  @column()
  public friendId: number;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>;

  @afterCreate()
  public static async sendRequest(friendshipRequest: FriendshipRequest) {
    const user = await User.findOrFail(friendshipRequest.userId);

    await user.load("avatar");

    Ws.io
      .to(`user-${friendshipRequest.friendId}`)
      .emit("newFriendshipRequest", {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatar: user.avatar
      });
  }
}
