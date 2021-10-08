import { schema } from "@ioc:Adonis/Core/Validator";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export default class StoreValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    file: schema.file({
      extnames: ["png", "jpg", "jpeg", "mp3", "mp4"],
      size: "20mb"
    })
  });

  public messages = {};
}
