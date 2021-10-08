import { UserFactory } from "Database/factories/UserFactory";
import { request } from ".";

export default async () => {
  const user = await UserFactory.merge({ password: "secret" }).create();

  const {
    body: { token }
  } = await request
    .post("/auth")
    .send({ email: user.email, password: "secret" });

  return { user, token };
};
