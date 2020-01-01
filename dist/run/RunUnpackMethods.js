"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const ts = require("typescript");
const Walk_1 = require("../src/Walk");
const UnpackMethods_1 = require("../src/UnpackMethods");
const TextChanges_1 = require("../src/TextChanges");
const fileOrDir = process.argv[2];
const ignoreList = process.argv.slice(3);
let fileList = [fileOrDir];
if (fs_1.existsSync(fileOrDir) && fs_1.lstatSync(fileOrDir).isDirectory())
    fileList = Walk_1.walk(fileOrDir).filter((file) => file.endsWith('.ts'));
for (const file of fileList) {
    console.log('Unpacking "' + file + '"');
    const text = fs_1.readFileSync(file).toString();
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
    const changes = UnpackMethods_1.unpackMethods(sourceFile, ignoreList);
    const newText = TextChanges_1.applyTextChanges(text, changes);
    fs_1.writeFileSync(file, newText);
}
