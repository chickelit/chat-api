import BaseSchema from "@ioc:Adonis/Lucid/Schema";
import { messageCategories } from "App/utils";

export default class Messages extends BaseSchema {
  protected tableName = "messages";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table
        .integer("user_id")
        .unsigned()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE")
        .onUpdate("CASCADE")
        .notNullable();
      table
        .integer("conversation_id")
        .unsigned()
        .references("id")
        .inTable("conversations")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");
      table
        .integer("group_id")
        .unsigned()
        .references("id")
        .inTable("groups")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");
      table.enum("category", messageCategories).notNullable();
      table.text("content", "longtext");
      table.string("url");
      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
