import Route from "@ioc:Adonis/Core/Route";

Route.post("/register", "Register/MainController.store");
Route.get("/register/:key", "Register/MainController.show");
Route.put("/register", "Register/MainController.update");
