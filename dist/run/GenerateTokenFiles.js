"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
function generateTokenFiles(fileOrDir) {
    const child = child_process_1.spawnSync('java', ['-cp', 'tokenizer/external/*;tokenizer/bin;', 'app.App', fileOrDir]);
    if (child.stderr)
        console.error(child.stderr.toString());
}
exports.generateTokenFiles = generateTokenFiles;
