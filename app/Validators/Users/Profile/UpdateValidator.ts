import { schema, rules } from "@ioc:Adonis/Core/Validator";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export default class UpdateValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string.optional({ trim: true }),
    username: schema.string.optional({ trim: true }, [
      rules.unique({ table: "users", column: "username" })
    ])
  });

  public messages = {};
}
