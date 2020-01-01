"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const ts_morph_1 = require("ts-morph");
function addMissingSuper(tsConfigFilePath) {
    const project = new ts_morph_1.Project({ tsConfigFilePath });
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
}
exports.addMissingSuper = addMissingSuper;
