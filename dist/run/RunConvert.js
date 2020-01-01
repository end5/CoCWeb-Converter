"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const Walk_1 = require("../src/Walk");
const Convert_1 = require("../src/Convert");
// Command line arg for file or directory to start
const fileOrDir = process.argv[2];
let fileList = [fileOrDir];
if (fs_1.existsSync(fileOrDir) && fs_1.lstatSync(fileOrDir).isDirectory())
    fileList = Walk_1.walk(fileOrDir).filter((file) => file.endsWith('.as'));
for (const file of fileList) {
    console.log('Converting "' + file + '"');
    let newText = new Convert_1.Converter(file).convert();
    fs_1.writeFile(file, newText, (err) => { if (err)
        console.log(err); });
}
