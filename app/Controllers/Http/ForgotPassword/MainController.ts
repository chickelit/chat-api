import Mail from "@ioc:Adonis/Addons/Mail";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Database from "@ioc:Adonis/Lucid/Database";
import { User, UserKey } from "App/Models";
import { StoreValidator, UpdateValidator } from "App/Validators/ForgotPassword";
import faker from "faker";

export default class ForgotPasswordController {
  public async store({ request }: HttpContextContract) {
    const user = await Database.transaction(async (trx) => {
      const { email, redirectUrl } = await request.validate(StoreValidator);
      const user = await User.findByOrFail("email", email);

      user.useTransaction(trx);

      const key = faker.datatype.uuid() + user.id;
      await user.related("keys").create({ key });
      const link = `${redirectUrl.replace(/\/$/, "")}/forgot-password/${key}`;

      await Mail.send((message) => {
        message.to(email);
        message.from("contato@whatsApp.com", "WhatsApp");
        message.subject("Recuperação de senha");
        message.htmlView("emails/forgot-password.edge", { link });
      });

      return user;
    });

    return user;
  }

  public async show({ params }: HttpContextContract) {
    const userKey = await UserKey.findByOrFail("key", params.key);

    await userKey.load("user");

    return userKey.user;
  }

  public async update({ request }: HttpContextContract) {
    const { key, password } = await request.validate(UpdateValidator);

    const userKey = await UserKey.findByOrFail("key", key);
    await userKey.load("user");
    const user = userKey.user;

    user.merge({ password });
    await user.save();

    await userKey.delete();

    return user;
  }
}
