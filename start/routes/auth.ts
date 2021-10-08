import Route from "@ioc:Adonis/Core/Route";

Route.post("/auth", "Auth/MainController.store");
Route.delete("/auth", "Auth/MainController.destroy").middleware("auth");
