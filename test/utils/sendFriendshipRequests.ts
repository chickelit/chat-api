import { request } from ".";

export default async (userId: number, tokens: string[]) => {
  const queries = tokens.map(async (token) => {
    await request
      .post("/friendships/requests")
      .send({ userId: userId })
      .set("authorization", `bearer ${token}`)
      .expect(200);
  });

  await Promise.all(queries);
};
