import { writeFileSync, existsSync, lstatSync, readFileSync } from "fs";
import * as ts from "typescript";
import { CoCConfig } from "./CoCConfig";
import { walk } from "../src/Walk";
import { unpackMethodChanges } from "../src/UnpackMethods";
import { applyTextChanges } from "../src/TextChanger";

const fileOrDir = process.argv[2];

let fileList = [fileOrDir];
if (existsSync(fileOrDir) && lstatSync(fileOrDir).isDirectory())
    fileList = walk(fileOrDir).filter((file) => file.endsWith('.ts'));

for (const file of fileList) {
    console.log('Unpacking "' + file + '"');

    const text = readFileSync(file).toString();

    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
    const changes = unpackMethodChanges(sourceFile, CoCConfig);
    const newText = applyTextChanges(text, changes);

    writeFileSync(file, newText);
}
