import { readFileSync } from "fs";
import { lex } from "./Lexer/Lexer";

testLexer('tests/test3.as');

function testLexer(path: string) {
    const text = readFileSync(path).toString();

    const tokens = lex(text);

    for (const token of tokens)
        console.log(token.type + ':"' + token.text.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"');

}
