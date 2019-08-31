import { existsSync, lstatSync } from "fs";
import { Project } from "ts-morph";
import { walk } from "../src/Walk";

const fileOrDir = process.argv[2];

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
for (const sourceFile of sourceFiles) {
    console.log('Formatting ' + sourceFile.getFilePath());

    sourceFile.formatText({
        ensureNewLineAtEndOfFile: true,
    });

    sourceFile.fixMissingImports();

}

project.saveSync();
