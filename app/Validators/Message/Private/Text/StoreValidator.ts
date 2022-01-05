import { schema, rules } from "@ioc:Adonis/Core/Validator";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export default class StoreValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    receiverId: schema.number([rules.exists({ column: "id", table: "users" })]),
    content: schema.string({ trim: true })
  });

  public messages = {};
}
