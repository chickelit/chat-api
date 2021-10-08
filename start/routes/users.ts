import Route from "@ioc:Adonis/Core/Route";

/* profile */
Route.get("/users/profile", "Users/ProfileController.show").middleware("auth");
Route.put("/users/profile", "Users/ProfileController.update").middleware(
  "auth"
);

/* search */
Route.get("/users/search", "Users/SearchController.show").middleware("auth");

/* blocks */
Route.get("/users/blocks", "Users/BlocksController.index").middleware("auth");
Route.post("/users/blocks", "Users/BlocksController.store").middleware("auth");
Route.delete("/users/blocks/:id", "Users/BlocksController.destroy").middleware(
  "auth"
);

/* avatar */
Route.put("/users/avatar", "Users/AvatarController.update").middleware("auth");
Route.delete("/users/avatar", "Users/AvatarController.destroy").middleware(
  "auth"
);
