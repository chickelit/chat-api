import BaseSchema from "@ioc:Adonis/Lucid/Schema";
import { fileCategories } from "App/utils";

export default class Files extends BaseSchema {
  protected tableName = "files";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table
        .integer("user_id")
        .unsigned()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");
      table
        .integer("group_id")
        .unsigned()
        .references("id")
        .inTable("groups")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");
      table
        .integer("message_id")
        .unsigned()
        .references("id")
        .inTable("messages")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");
      table.enum("file_category", fileCategories).notNullable();
      table.string("file_name").notNullable();
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
