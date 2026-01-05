// banner_kiro_braille.js
const purple = "\x1b[38;2;144;70;255m"; // #9046FF
const reset = "\x1b[0m";

const brailleArt = `
⠀⠀⠀⠀⠀⠀⣀⣀⣀⣀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣠⣾⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀
⠀⠀⠀⣰⣿⣿⠿⠛⠛⠿⣿⣿⣆⠀⠀⠀
⠀⠀⠀⣿⣿⠁⠀⠀⠀⠀⠈⣿⣿⠀⠀⠀
⠀⠀⠀⣿⣿⣄⠀⠀⠀⠀⣠⣿⣿⠀⠀⠀
⠀⠀⠀⠹⣿⣿⣦⣄⣠⣴⣿⣿⠏⠀⠀⠀
⠀⠀⠀⠀⠈⠻⣿⣿⣿⣿⠟⠁⠀⠀⠀⠀
`;

console.log(purple + brailleArt + reset);
