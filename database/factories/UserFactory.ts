import Factory from "@ioc:Adonis/Lucid/Factory";
import { User } from "App/Models";

export const UserFactory = Factory.define(User, ({ faker }) => {
  return {
    email: faker.internet.email(),
    name: faker.name.findName(),
    username: faker.internet.userName()
  };
}).build();
