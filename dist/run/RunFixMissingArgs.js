"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const ts_morph_1 = require("ts-morph");
const FixMissingArgs_1 = require("../src/FixMissingArgs");
const Walk_1 = require("../src/Walk");
const fileOrDir = process.argv[2];
const temp = process.argv.slice(3);
if (temp.length % 2 !== 0)
    throw new Error('Unmatched parameters');
const paramPairs = [];
let identifier;
for (let index = 0; index < temp.length; index++) {
    if (index % 2 === 0) {
        identifier = temp[index];
    }
    else {
        paramPairs.push([identifier, temp[index]]);
    }
}
const project = new ts_morph_1.Project({
    compilerOptions: {
        noLib: true,
        lib: []
    }
});
// All .ts found in recursive search or tsconfig.json or file.ts
if (fs_1.existsSync(fileOrDir) && fs_1.lstatSync(fileOrDir).isDirectory()) {
    const fileList = Walk_1.walk(fileOrDir).filter((file) => file.endsWith('.ts'));
    for (const file of fileList)
        project.addExistingSourceFile(file);
}
else if (fileOrDir.endsWith('tsconfig.json'))
    project.addSourceFilesFromTsConfig(fileOrDir);
else
    project.addExistingSourceFile(fileOrDir);
const sourceFiles = project.getSourceFiles();
let foundProblem = true;
while (foundProblem) {
    foundProblem = false;
    for (const sourceFile of sourceFiles) {
        console.log('Fixing ' + sourceFile.getFilePath());
        while (FixMissingArgs_1.fixMissingArgs(sourceFile, paramPairs))
            foundProblem = true;
    }
}
project.saveSync();
