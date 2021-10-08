import Route from "@ioc:Adonis/Core/Route";

Route.post(
  "/messages/conversation/text",
  "Messages/Conversation/MainController.store"
).middleware("auth");
Route.post(
  "/messages/conversation/:id/media",
  "Messages/Conversation/MediaController.store"
).middleware("auth");
Route.get(
  "/messages/conversation/:id",
  "Messages/Conversation/MainController.index"
).middleware("auth");

Route.post(
  "/messages/group/text",
  "Messages/Group/MainController.store"
).middleware("auth");
Route.post(
  "/messages/group/:id/media",
  "Messages/Group/MediaController.store"
).middleware("auth");
Route.get(
  "/messages/group/:id",
  "Messages/Group/MainController.index"
).middleware("auth");
