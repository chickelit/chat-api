import Route from "@ioc:Adonis/Core/Route";

Route.get("/users/profile", "Users/ProfileController.show").middleware("auth");
Route.put("/users/profile", "Users/ProfileController.update").middleware(
  "auth"
);

Route.get("/users/search", "Users/SearchController.show").middleware("auth");

Route.put("/users/avatar", "Users/AvatarController.update").middleware("auth");
Route.delete("/users/avatar", "Users/AvatarController.destroy").middleware(
  "auth"
);
