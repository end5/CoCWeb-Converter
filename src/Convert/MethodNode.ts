import * as ts from "typescript";
import { ClassInfo } from "./ClassNode";
import { convertBlockInnards } from "./BlockNode";

/**
 * Converts a Method to a Function. Automatically adds 'player: Character' to arguments if it is found in the body.
 * @param node
 */
export function convertMethod(node: ts.MethodDeclaration, context: ts.TransformationContext, info: ClassInfo) {
    if (node.body)
        node.body = convertBlockInnards(node.body, context, info);

    if (~info.requiresPlayer.indexOf(node))
        node.parameters = ts.createNodeArray([
            ts.createParameter(
                /*decorators*/ undefined,
                /*modifiers*/ undefined,
                /*dotDotDotToken*/ undefined,
                /*name*/ ts.createIdentifier('player'),
                /*questionToken*/ undefined,
                /*type*/ ts.createTypeReferenceNode('Character', /*typeArguments*/ undefined)
            ),
            ...node.parameters
        ]);

    return node;
}

export function convertMethodToFunction(method: ts.MethodDeclaration) {
    let modifiers;
    // Convert "public" to "export"
    if (method.modifiers && method.modifiers.find((modNode) => modNode.kind === ts.SyntaxKind.PublicKeyword))
        modifiers = [ts.createToken(ts.SyntaxKind.ExportKeyword)];

    return ts.createFunctionDeclaration(
        /*decorators*/ undefined,
        /*modifiers*/ modifiers,
        /*asteriskToken*/ undefined,
        /*name*/ method.name.getText(),
        /*typeParameters*/ undefined,
        /*parameters*/ method.parameters,
        /*returnType*/ undefined,
        /*body*/ method.body
    );
}
