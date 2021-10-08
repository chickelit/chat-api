import Route from "@ioc:Adonis/Core/Route";

Route.get(
  "/friendships/requests",
  "Friendships/RequestsController.index"
).middleware("auth");
Route.post(
  "/friendships/requests",
  "Friendships/RequestsController.store"
).middleware("auth");
Route.delete(
  "/friendships/requests/:id",
  "Friendships/RequestsController.destroy"
).middleware("auth");

Route.get("/friendships", "Friendships/MainController.index").middleware(
  "auth"
);
Route.post("/friendships", "Friendships/MainController.store").middleware(
  "auth"
);
Route.delete(
  "/friendships/:id",
  "Friendships/MainController.destroy"
).middleware("auth");
