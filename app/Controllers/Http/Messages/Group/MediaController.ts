import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { Group } from "App/Models";
import { StoreValidator } from "App/Validators/Message/Group/Media";
import Application from "@ioc:Adonis/Core/Application";

export default class MediaController {
  public async store({ request, response, params, auth }: HttpContextContract) {
    const { file } = await request.validate(StoreValidator);
    const user = auth.user!;

    const group = await Group.findOrFail(params.id);
    await group.load("members");

    if (!group.members.some((member) => member.id === user.id)) {
      return response.badRequest();
    }

    const message = await group.related("messages").create({
      userId: user.id,
      category: "media"
    });

    const mediaFile = await message.related("media").create({
      fileCategory: "media",
      fileName: `${new Date().getTime()}.${file.extname}`
    });

    await file.move(Application.tmpPath("uploads"), {
      name: mediaFile.fileName,
      overwrite: true
    });

    await message.load("owner", (owner) => {
      owner.preload("avatar");
    });

    await message.load("media");

    return message;
  }
}
