import { readFileSync } from "fs";
import { lex } from "../../src/Lexer/Lexer";

const path = 'tests/Lexer/';

const files = [path + "test.as"];

for (const file of files) {
    const text = readFileSync(file).toString();

    const tokens = lex(text);

    for (const token of tokens)
        console.log( `[${token.pos}:${token.text.length}]` + token.type + ':"' + JSON.stringify(token.text) + '"');

}
