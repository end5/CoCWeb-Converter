import { existsSync, lstatSync } from "fs";
import { Project } from "ts-morph";

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
for (const sourceFile of sourceFiles) {
    console.log('Formatting ' + sourceFile.getFilePath());

    sourceFile.formatText({
        ensureNewLineAtEndOfFile: true,
    });

    sourceFile.fixMissingImports();

}

project.saveSync();
