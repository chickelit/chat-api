import { schema, rules } from "@ioc:Adonis/Core/Validator";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export default class UpdateValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    groupId: schema.number([rules.exists({ column: "id", table: "groups" })]),
    title: schema.string({ trim: true }, [rules.maxLength(32)])
  });

  public messages = {};
}
