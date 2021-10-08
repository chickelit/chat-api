import {
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
  computed
} from "@ioc:Adonis/Lucid/Orm";
import User from "./User";
import Env from "@ioc:Adonis/Core/Env";
import { FileCategory } from "App/utils";
import { Group, Message } from ".";

export default class File extends BaseModel {
  @column({ isPrimary: true, serializeAs: null })
  public id: number;

  @column({ serializeAs: null })
  public userId: number;

  @column({ serializeAs: null })
  public groupId: number;

  @column({ serializeAs: null })
  public messageId: number;

  @column({ serializeAs: null })
  public fileCategory: FileCategory;

  @column({ serializeAs: null })
  public fileName: string;

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>;

  @computed()
  public get url() {
    return `${Env.get("APP_URL")}/uploads/${this.fileName}`;
  }

  @belongsTo(() => Group)
  public group: BelongsTo<typeof Group>;

  @belongsTo(() => Message)
  public message: BelongsTo<typeof Message>;
}
