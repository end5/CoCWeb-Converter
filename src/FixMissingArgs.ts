import { SyntaxKind, TypeGuards, SourceFile, MethodDeclaration, FunctionDeclaration } from "ts-morph";

/**
 * Compares each function call to its definition and adds any missing parameters.
 * Returns true if a change happened.
 * @param sourceFile
 * @param paramPairs
 */
export function fixMissingArgs(sourceFile: SourceFile, paramPairs: [string, string][]) {
    let changeOccured = false;
    let checkAgain = true;
    while (checkAgain) {
        console.log('Checking again');
        const methodsAndFunctions = [
            ...sourceFile.getFunctions(),
            ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration)
        ];
        const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
        for (const call of calls) {
            const identity = call.getFirstDescendantByKind(SyntaxKind.Identifier);
            if (identity) {
                const funcDefs = identity.getDefinitionNodes();
                for (const funcDef of funcDefs) {
                    if (TypeGuards.isFunctionDeclaration(funcDef) || TypeGuards.isMethodDeclaration(funcDef)) {
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

/**
 * Checks for identifiers in the body that are in params and adds it as a parameter to the method.
 * Returns true if a change occured.
 * @param method
 * @param paramPairs
 */
function fixBody(method: MethodDeclaration | FunctionDeclaration, paramPairs: [string, string][]) {
    let changed = false;
    const methodBody = method.getBody();
    if (methodBody) {
        const identifiers = methodBody.getDescendantsOfKind(SyntaxKind.Identifier);

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
