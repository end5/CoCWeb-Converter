"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const Walk_1 = require("../src/Walk");
function deleteTokenFiles(fileOrDir) {
    let fileList = [fileOrDir];
    if (fs_1.existsSync(fileOrDir) && fs_1.lstatSync(fileOrDir).isDirectory())
        fileList = Walk_1.walk(fileOrDir).filter((file) => file.endsWith('.tkns'));
    for (const file of fileList) {
        console.log('Deleting "' + file + '"');
        fs_1.unlinkSync(file);
    }
}
exports.deleteTokenFiles = deleteTokenFiles;
