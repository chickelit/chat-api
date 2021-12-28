import { request } from ".";

interface Payload {
  email: string;
  password: string;
}

export default async ({ email, password }: Payload) => {
  const { body } = await request
    .post("/auth")
    .send({ email, password })
    .expect(200);

  return { token: body.token };
};
