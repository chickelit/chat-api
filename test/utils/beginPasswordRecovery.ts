import Mail from "@ioc:Adonis/Addons/Mail";
import { UserKey } from "App/Models";
import { UserFactory } from "Database/factories/UserFactory";
import faker from "faker";
import { Assert } from "japa/build/src/Assert";
import { request } from ".";

export default async (assert: Assert) => {
  const user = await UserFactory.merge({ password: "secret" }).create();

  Mail.trap((message) => {
    assert.deepEqual(message.to, [{ address: user.email }]);
    assert.deepEqual(message.from, {
      address: "contato@ChatApp.com",
      name: "ChatApp"
    });
    assert.deepEqual(message.subject, "Recuperação de senha");
  });

  await request
    .post("/forgot-password")
    .send({
      email: user.email,
      redirectUrl: faker.internet.url()
    })
    .expect(200);

  Mail.restore();

  const { key } = await UserKey.findByOrFail("userId", user.id);

  return { user, key };
};
