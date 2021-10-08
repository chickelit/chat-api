import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { StoreValidator, UpdateValidator } from "App/Validators/Register";
import Database from "@ioc:Adonis/Lucid/Database";
import faker from "faker";
import { User, UserKey } from "App/Models";
import Mail from "@ioc:Adonis/Addons/Mail";

export default class RegisterController {
  public async store({ request }: HttpContextContract) {
    await Database.transaction(async (trx) => {
      const { email, redirectUrl } = await request.validate(StoreValidator);

      const user = new User();
      user.useTransaction(trx);
      user.email = email;
      await user.save();

      const key = faker.datatype.uuid() + user.id;
      await user.related("keys").create({ key });
      const link = `${redirectUrl.replace(/\/$/, "")}/register/${key}`;

      await Mail.send((message) => {
        message.to(email);
        message.from("contato@whatsapp.com", "WhatsApp");
        message.subject("Confirmação do registro");
        message.htmlView("emails/verify-register.edge", { link });
      });
    });
  }

  public async show({ params }: HttpContextContract) {
    const userKey = await UserKey.findByOrFail("key", params.key);

    await userKey.load("user");

    return userKey.user;
  }

  public async update({ request }: HttpContextContract) {
    const { key, ...data } = await request.validate(UpdateValidator);
    const userKey = await UserKey.findByOrFail("key", key);

    await userKey.load("user");

    const user = userKey.user;
    user.merge({ ...data });
    await user.save();

    await userKey.delete();

    return user;
  }
}
