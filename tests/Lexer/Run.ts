import { readFileSync, writeFileSync } from "fs";
import { lex } from "../../src/Lexer/Lexer";

// const str = JSON.stringify(`
// if (textCtnt.charAt(lastBracket-1) == "\\")
// {
//     // trace("WARNING: bracket is escaped 1", lastBracket);
// }
// `);
// const str = JSON.stringify('"\""');

// const text = str.slice(1, str.length - 1);

// console.log(text);

// const tokens = lex(text);

// for (const token of tokens)
//     console.log(`[${token.pos}|${token.text.length}|${token.type}] |${token.text}|`);

const path = 'tests/Lexer/';

const files = [path + "test2.as"];

for (const file of files) {
    const text = readFileSync(file).toString('utf8');

    const tokens = lex(text);

    for (const token of tokens)
        console.log( `[${token.pos}:${token.text.length}]` + token.type + ':"' + JSON.stringify(token.text) + '"');

    writeFileSync(path + 'test2.txt', tokens.map((token) => `[${token.pos}|${token.type}] "${token.text}"`).join('\n'));
}
