
import { existsSync, lstatSync } from "fs";
import { Project } from "ts-morph";
import { fixMissingArgs } from "../src/FixMissingArgs";
import { walk } from "../src/Walk";

const fileOrDir = process.argv[2];

const temp = process.argv.slice(3);
if (temp.length % 2 !== 0)
    throw new Error('Unmatched parameters');

const paramPairs: [string, string][] = [];
let identifier: string;
for (let index = 0; index < temp.length; index++) {
    if (index % 2 === 0) {
        identifier = temp[index];
    }
    else {
        paramPairs.push([identifier!, temp[index]]);
    }
}

const project = new Project({
    compilerOptions: {
        noLib: true,
        lib: []
    }
});

// All .ts found in recursive search or tsconfig.json or file.ts
if (existsSync(fileOrDir) && lstatSync(fileOrDir).isDirectory()) {
    const fileList = walk(fileOrDir).filter((file) => file.endsWith('.ts'));
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

        while (fixMissingArgs(sourceFile, paramPairs))
            foundProblem = true;
    }
}

project.saveSync();
