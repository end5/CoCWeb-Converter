import * as ts from "typescript";
import { Project } from "ts-morph";

// Command line arg for 'tsconfig.json'
const tsConfigFilePath = process.argv[2];

const project = new Project({ tsConfigFilePath });
const sourceFiles = project.getSourceFiles();
for (const sourceFile of sourceFiles) {
    for (const classNode of sourceFile.getClasses()) {
        if (classNode.getExtends()) {
            for (const constr of classNode.getConstructors()) {
                if (!constr.forEachDescendant((node) => node.getKind() === ts.SyntaxKind.SuperKeyword)) {
                    console.log('Missing super ' + sourceFile.getFilePath());
                    constr.insertStatements(0, 'super();');
                }
            }
        }
    }
}

project.save();
