"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
function walk(rootDir) {
    return recursiveWalk(rootDir, []);
}
exports.walk = walk;
function recursiveWalk(rootDir, paths) {
    const list = fs_1.readdirSync(rootDir);
    for (const path of list) {
        const dirPath = path_1.join(rootDir, path);
        if (fs_1.statSync(dirPath).isDirectory()) {
            recursiveWalk(dirPath, paths);
        }
        else {
            paths.push(path_1.join(rootDir, path));
        }
    }
    return paths;
}
