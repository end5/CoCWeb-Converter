
import { existsSync, lstatSync } from "fs";
import { Project } from "ts-morph";
import { CoCConfig } from "./CoCConfig";
import { fixMissingArgs } from "../src/FixMissingArgs";

const fileOrDir = process.argv[2];

const project = new Project({
    compilerOptions: {
        noLib: true,
        lib: []
    }
});

if (existsSync(fileOrDir) && lstatSync(fileOrDir).isDirectory())
    project.addExistingDirectory(fileOrDir);
else
    project.addExistingSourceFile(fileOrDir);

const sourceFiles = project.getSourceFiles();

let foundProblem = true;
while (foundProblem) {
    foundProblem = false;
    for (const sourceFile of sourceFiles) {
        console.log('Fixing ' + sourceFile.getFilePath());

        while (fixMissingArgs(sourceFile, CoCConfig))
            foundProblem = true;
    }
}

project.saveSync();
