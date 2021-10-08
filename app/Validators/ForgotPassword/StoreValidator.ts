import { schema, rules } from "@ioc:Adonis/Core/Validator";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export default class StoreValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    email: schema.string({ trim: true }, [rules.email(), rules.exists({ column: "email", table: "users" })]),
    redirectUrl: schema.string({ trim: true }, [rules.url()])
  });

  public messages = {};
}
