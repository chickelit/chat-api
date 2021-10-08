import Route from "@ioc:Adonis/Core/Route";

Route.post("/groups", "Groups/MainController.store").middleware("auth");
Route.put("/groups", "Groups/MainController.update").middleware("auth");
Route.get("/groups", "Groups/MainController.index").middleware("auth");
Route.get("/groups/:id", "Groups/MainController.show").middleware("auth");
Route.delete("/groups/:id", "Groups/MainController.destroy").middleware("auth");

Route.post("/members", "Groups/MembersController.store").middleware("auth");
Route.delete("/members", "Groups/MembersController.destroy").middleware("auth");
Route.get("/members/:id", "Groups/MembersController.index").middleware("auth");

Route.put("/groups/:id/cover", "Groups/ImageController.update").middleware(
  "auth"
);
Route.delete("/groups/:id/cover", "Groups/ImageController.destroy").middleware(
  "auth"
);
