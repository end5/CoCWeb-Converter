import { readFileSync, writeFileSync } from "fs";
import { convert } from "./Convert";

fixTSFile('tests/test3.as', 'tests/test3.ts');

function fixTSFile(path: string, pathOut: string) {
    let text = readFileSync(path).toString();

    text = convert(text);

    writeFileSync(pathOut, text);
}
