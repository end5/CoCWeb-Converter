import { readFileSync, writeFileSync } from "fs";
import { convert } from "../../src/Convert";
import { applyTextChanges } from "../../src/TextChanger";

const _path = 'tests/Convert/';

const files: [string, string][] = [[_path + "test.as", _path + "test.ts"]];

for (const file of files) {

    const text = readFileSync(file[0]).toString();

    const changes = convert(text, file[0], false);
    for (const change of changes)
        console.log(JSON.stringify(text.substr(change.span.start, change.span.length)) + '\n> ' + JSON.stringify(change.newText));
    const newText = applyTextChanges(text, changes);

    console.log(JSON.stringify(newText.substr(0, 100)));

    // console.log(text.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));

    writeFileSync(file[1], newText);
}
