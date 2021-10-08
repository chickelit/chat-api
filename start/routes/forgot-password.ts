import Route from "@ioc:Adonis/Core/Route";

Route.post("/forgot-password", "ForgotPassword/MainController.store");
Route.get("/forgot-password/:key", "ForgotPassword/MainController.show");
Route.put("/forgot-password", "ForgotPassword/MainController.update");
