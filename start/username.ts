import { validator } from "@ioc:Adonis/Core/Validator";

validator.rule("username", (value, _, options) => {
  let failed = false;

  if (typeof value !== "string") {
    return;
  }

  const characters = value.split("");
  const validCharacters = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    ".",
    "_"
  ];

  characters.forEach((character) => {
    if (
      validCharacters.indexOf(character.toLowerCase()) === -1 ||
      value.indexOf("..") !== -1
    ) {
      failed = true;
    }
  });

  if (failed) {
    options.errorReporter.report(
      options.pointer,
      "username",
      "username validation failed",
      options.arrayExpressionPointer
    );
  }
});
