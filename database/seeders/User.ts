import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
import User from "App/Models/User";

export default class UserSeeder extends BaseSeeder {
  public async run() {
    await User.createMany([
      {
        email: "jose@gmail.com",
        name: "José Anselmo Ferreira Matos",
        username: "Selminho",
        password: "secret"
      },
      {
        email: "clara@gmail.com",
        name: "Maria Clara de Pontes Santana",
        username: "Clarinha",
        password: "secret"
      },
      {
        email: "ronald@gmail.com",
        name: "Ronald de Noronha",
        username: "Ronald",
        password: "secret"
      },
      {
        email: "ryan@gmail.com",
        name: "Ryan",
        username: "Ryan",
        password: "secret"
      }
    ]);
  }
}
