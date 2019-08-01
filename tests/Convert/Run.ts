import { readFileSync, writeFileSync } from "fs";
import { convert } from "../../src/Convert";

fixTSFile('./test.as', './test.ts');

function fixTSFile(path: string, pathOut: string) {
    let text = readFileSync(path).toString();

    text = convert(text, false);

    // console.log(text.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));

    writeFileSync(pathOut, text);
}
