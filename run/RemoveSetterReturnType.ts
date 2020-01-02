import { Project } from "ts-morph";

const tsConfigFilePath = process.argv[2];

const project = new Project({ tsConfigFilePath });
const sourceFiles = project.getSourceFiles();
for (const sourceFile of sourceFiles) {
    console.log('Checking file ' + sourceFile.getFilePath());
    for (const classNode of sourceFile.getClasses()) {
        for (const setter of classNode.getSetAccessors()) {
            setter.removeReturnType();
        }
    }
}

project.save();
