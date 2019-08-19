import * as child_process from "child_process";
import { tokenClassNames } from "../../src/Token";

const path = 'tests/Scanner/';

const files = [path + "test2.as"];

for (const file of files) {
    const child = child_process.spawnSync(
        'java', ['-cp', 'tokenizer/external/*;tokenizer/bin;', 'app.App', file],
    );

    interface Token {
        type: number;
        start: number;
        text: string;
    }

    if (child.stderr)
        console.error(child.stderr.toString());

    const tokens: Token[] = JSON.parse(child.stdout.toString());

    for (const token of tokens) {
        console.log("[" + token.start + ":" + (token.start + token.text.length) + "] " + tokenClassNames[token.type] + " \"" + token.text + "\"");
    }
}
