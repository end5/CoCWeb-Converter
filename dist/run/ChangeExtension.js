"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const Walk_1 = require("../src/Walk");
function changeExtension(fileOrDir) {
    let fileList = [fileOrDir];
    if (fs_1.existsSync(fileOrDir) && fs_1.lstatSync(fileOrDir).isDirectory())
        fileList = Walk_1.walk(fileOrDir).filter((file) => file.endsWith('.as'));
    for (const file of fileList) {
        console.log('Changing extension (.as -> .ts) for "' + file + '"');
        fs_1.renameSync(file, file.replace('.as', '.ts'));
    }
}
exports.changeExtension = changeExtension;
