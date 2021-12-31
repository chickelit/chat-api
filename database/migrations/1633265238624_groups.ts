import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class Groups extends BaseSchema {
  protected tableName = "groups";

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
      table.string("title", 30).notNullable();
      table.string("latest_message_at").defaultTo(new Date().toISOString());
      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
