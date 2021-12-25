import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { File } from "App/Models";
import Application from "@ioc:Adonis/Core/Application";

export default class UploadsController {
  public async show({ response, params }: HttpContextContract) {
    const file = await File.findByOrFail("filename", params.filename);

    return response.download(Application.tmpPath("uploads", file.fileName));
  }
}
