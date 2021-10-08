const messageCategories = ["text", "media"] as const;

type MessageCategory = typeof messageCategories[number];

export { messageCategories, MessageCategory };
