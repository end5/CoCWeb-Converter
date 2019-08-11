import { SyntaxKind, TypeGuards, SourceFile, MethodDeclaration, FunctionDeclaration } from "ts-morph";
import { TransformConfig, ParameterStruct } from "./Config";

/**
 * Compares each function call to its definition and adds any missing parameters.
 * Returns true if a change happened.
 * @param sourceFile
 * @param config
 */
export function fixMissingArgs(sourceFile: SourceFile, config: TransformConfig) {
    let changeOccured = false;
    let checkAgain = true;
    while (checkAgain) {
        // log('Checking again');
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
                            call.insertArguments(0, params.map((node) => node.getName()));
                            changeOccured = true;
                        }
                    }
                }
            }
        }

        checkAgain = false;
        for (const method of methodsAndFunctions) {
            checkAgain = checkAgain || fixBody(method, config.identiferToParamPairs);
        }
    }
    return changeOccured;
}

/**
 * Checks for identifiers in the body that are in params and adds it as a parameter to the method.
 * Returns true if a change occured.
 * @param method
 * @param params
 */
function fixBody(method: MethodDeclaration | FunctionDeclaration, params: ParameterStruct[]) {
    let changed = false;
    const methodBody = method.getBody();
    if (methodBody) {
        const identifiers = methodBody.getDescendantsOfKind(SyntaxKind.Identifier);

        for (const paramStruct of params) {
            // Fix monster parameter requirement
            const match = identifiers.find((node) => node.getText() === paramStruct.name);
            if (match && !method.getParameters().find((param) => param.getName() === paramStruct.name)) {
                changed = true;
                // log('    Found ' + paramStruct.name);
                method.insertParameter(0, paramStruct);
            }
        }
    }
    return changed;
}
