"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_morph_1 = require("ts-morph");
function removeSetterReturnType(tsConfigFilePath) {
    const project = new ts_morph_1.Project({ tsConfigFilePath });
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
}
exports.removeSetterReturnType = removeSetterReturnType;
