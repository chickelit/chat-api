import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { UpdateValidator } from "App/Validators/Users/Avatar";
import Application from "@ioc:Adonis/Core/Application";
import fs from "fs";
import Database from "@ioc:Adonis/Lucid/Database";
import { FileCategory } from "App/utils";

export default class AvatarController {
  public async update({ request, auth }: HttpContextContract) {
    const avatar = await Database.transaction(async (trx) => {
      const { file } = await request.validate(UpdateValidator);
      const user = auth.user!;

      user.useTransaction(trx);

      const searchPayload = {};
      const savePayload = {
        fileCategory: "avatar" as FileCategory,
        fileName: `${new Date().getTime()}.${file.extname}`
      };

      const avatar = await user
        .related("avatar")
        .firstOrCreate(searchPayload, savePayload);

      await file.move(Application.tmpPath("uploads"), {
        name: avatar.fileName,
        overwrite: true
      });

      return avatar;
    });

    return avatar;
  }

  public async destroy({ auth }: HttpContextContract) {
    const user = auth.user!;

    await user.load("avatar");
    const avatar = user.avatar;

    fs.unlinkSync(Application.tmpPath("uploads", avatar.fileName));

    await avatar.delete();
  }
}
