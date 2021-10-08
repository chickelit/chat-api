const fileCategories = ["avatar", "media", "groupCover"] as const;

type FileCategory = typeof fileCategories[number];

export { fileCategories, FileCategory };
