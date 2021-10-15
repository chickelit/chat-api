import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { Group } from "App/Models";
import { UpdateValidator } from "App/Validators/Groups/Cover";
import Application from "@ioc:Adonis/Core/Application";
import { FileCategory } from "App/utils";
import Database from "@ioc:Adonis/Lucid/Database";

export default class ImagesController {
  public async update({
    request,
    response,
    params,
    auth
  }: HttpContextContract) {
    const cover = await Database.transaction(async (trx) => {
      const { file } = await request.validate(UpdateValidator);
      const user = auth.user!;

      const group = await Group.findOrFail(+params.id);

      if (group.userId !== auth.user!.id) {
        return response.badRequest();
      }

      user.useTransaction(trx);

      const searchPayload = {};
      const savePayload = {
        fileCategory: "groupCover" as FileCategory,
        fileName: `${new Date().getTime()}.${file.extname}`
      };

      const cover = await group
        .related("groupCover")
        .firstOrCreate(searchPayload, savePayload);

      await file.move(Application.tmpPath("uploads"), {
        name: cover.fileName,
        overwrite: true
      });

      return cover;
    });

    return cover;
  }

  public async destroy({ response, params, auth }: HttpContextContract) {
    const group = await Group.findOrFail(params.id);

    if (group.userId !== auth.user!.id) {
      return response.badRequest();
    }

    await group.load("groupCover");

    await group.groupCover.delete();
  }
}
