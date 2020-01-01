"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_morph_1 = require("ts-morph");
/**
 * Compares each function call to its definition and adds any missing parameters.
 * Returns true if a change happened.
 * @param sourceFile
 * @param paramPairs
 */
function fixMissingArgs(sourceFile, paramPairs) {
    let changeOccured = false;
    let checkAgain = true;
    while (checkAgain) {
        console.log('Checking again');
        const methodsAndFunctions = [
            ...sourceFile.getFunctions(),
            ...sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.MethodDeclaration)
        ];
        const calls = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression);
        for (const call of calls) {
            const identity = call.getFirstDescendantByKind(ts_morph_1.SyntaxKind.Identifier);
            if (identity) {
                const funcDefs = identity.getDefinitionNodes();
                for (const funcDef of funcDefs) {
                    if (ts_morph_1.TypeGuards.isFunctionDeclaration(funcDef) || ts_morph_1.TypeGuards.isMethodDeclaration(funcDef)) {
                        const args = call.getArguments();
                        const params = funcDef.getParameters().filter((param) => !param.isOptional());
                        if (args.length < params.length) {
                            call.insertArguments(0, params.map((node) => node.getName()).slice(0, params.length - args.length));
                            changeOccured = true;
                        }
                    }
                }
            }
        }
        checkAgain = false;
        for (const method of methodsAndFunctions) {
            checkAgain = checkAgain || fixBody(method, paramPairs);
        }
    }
    return changeOccured;
}
exports.fixMissingArgs = fixMissingArgs;
/**
 * Checks for identifiers in the body that are in params and adds it as a parameter to the method.
 * Returns true if a change occured.
 * @param method
 * @param paramPairs
 */
function fixBody(method, paramPairs) {
    let changed = false;
    const methodBody = method.getBody();
    if (methodBody) {
        const identifiers = methodBody.getDescendantsOfKind(ts_morph_1.SyntaxKind.Identifier);
        for (const paramPair of paramPairs) {
            // Fix monster parameter requirement
            const match = identifiers.find((node) => node.getText() === paramPair[0]);
            if (match && !method.getParameters().find((param) => param.getName() === paramPair[0])) {
                changed = true;
                // log('    Found ' + paramStruct.name);
                method.insertParameter(0, { name: paramPair[0], type: paramPair[1] });
            }
        }
    }
    return changed;
}
