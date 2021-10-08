import Route from "@ioc:Adonis/Core/Route";

Route.get("/conversations", "Conversations/MainController.index").middleware(
  "auth"
);
Route.post("/conversations", "Conversations/MainController.store").middleware(
  "auth"
);
Route.get("/conversations/:id", "Conversations/MainController.show").middleware(
  "auth"
);
