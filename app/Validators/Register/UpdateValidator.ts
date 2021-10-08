import { schema, rules } from "@ioc:Adonis/Core/Validator";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export default class UpdateValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    key: schema.string({ trim: true }, [rules.exists({ column: "key", table: "user_keys" })]),
    name: schema.string({ trim: true }),
    username: schema.string({ trim: true }, [rules.unique({ table: "users", column: "username" })]),
    password: schema.string({ trim: true }, [rules.confirmed("passwordConfirmation")])
  });

  public messages = {};
}
