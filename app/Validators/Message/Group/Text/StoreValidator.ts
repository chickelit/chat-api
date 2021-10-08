import { schema, rules } from "@ioc:Adonis/Core/Validator";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export default class StoreValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    groupId: schema.number([rules.exists({ column: "id", table: "groups" })]),
    content: schema.string({ trim: true })
  });

  public messages = {};
}
