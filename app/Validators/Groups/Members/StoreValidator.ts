import { schema, rules } from "@ioc:Adonis/Core/Validator";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export default class StoreValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    groupId: schema.number([rules.exists({ table: "groups", column: "id" })]),
    userId: schema.number([rules.exists({ table: "users", column: "id" })])
  });

  public messages = {};
}
