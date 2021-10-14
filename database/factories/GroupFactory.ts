import Factory from "@ioc:Adonis/Lucid/Factory";
import { Group } from "App/Models";

export const GroupFactory = Factory.define(Group, ({ faker }) => {
  return {
    title: faker.lorem.words(2)
  };
}).build();
