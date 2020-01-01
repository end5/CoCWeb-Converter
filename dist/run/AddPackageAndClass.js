"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const Walk_1 = require("../src/Walk");
function addPackageAndClass(fileOrDir, rootPath) {
    let fileList = [fileOrDir];
    if (fs_1.existsSync(fileOrDir) && fs_1.lstatSync(fileOrDir).isDirectory())
        fileList = Walk_1.walk(fileOrDir).filter((file) => file.endsWith('.as'));
    for (const filePath of fileList) {
        console.log('Fixing "' + filePath + '"');
        let text = fs_1.readFileSync(filePath).toString();
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }
        const list = path_1.relative(rootPath, filePath).split('\\');
        list.pop();
        const packageText = list.join('.');
        fs_1.writeFileSync(filePath, 'package ' + packageText + ' {\n' +
            'public class ' + path_1.basename(filePath).substr(0, path_1.basename(filePath).length - 3) + ' {\n' +
            text +
            '\n}\n' +
            '\n}\n');
    }
}
exports.addPackageAndClass = addPackageAndClass;
