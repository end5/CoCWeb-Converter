"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const ts_morph_1 = require("ts-morph");
const Walk_1 = require("../src/Walk");
const fileOrDir = process.argv[2];
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
for (const sourceFile of sourceFiles) {
    console.log('Formatting ' + sourceFile.getFilePath());
    sourceFile.formatText({
        ensureNewLineAtEndOfFile: true,
    });
    sourceFile.fixMissingImports();
}
project.saveSync();
