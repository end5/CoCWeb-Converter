import * as ts from "typescript";
import { fixBlockInnards } from "./BlockNode";
import { ConvertState } from "./ConvertState";

export function fixMethodNode(node: ts.MethodDeclaration, context: ts.TransformationContext, info: ConvertState) {
    if (node.body)
        node.body = fixBlockInnards(node.body, context, info);

    fixPlayerParams(node, info);

    return node;
}

export function fixPlayerParams(node: ts.SignatureDeclarationBase, info: ConvertState) {
    // Add 'player: Player' to parameter array
    if (
        ~info.requiresPlayer.indexOf(node) &&
        (
            node.parameters.length === 0 ||
            (
                node.parameters.length > 0 &&
                ts.isIdentifier(node.parameters[0].name) &&
                node.parameters[0].name.text !== 'player'
            )
        )
    ) {
        // if (node.parameters.length === 0)
        //     console.log('Player needed. No params. ' + node.getText());
        // else
        //     console.log('Player needed. ' + node.parameters.length + ' ' + (node.parameters[0].name as any).text);

        node.parameters = ts.createNodeArray([
            ts.createParameter(
                /*decorators*/ undefined,
                /*modifiers*/ undefined,
                /*dotDotDotToken*/ undefined,
                /*name*/ ts.createIdentifier('player'),
                /*questionToken*/ undefined,
                /*type*/ ts.createTypeReferenceNode('Player', /*typeArguments*/ undefined)
            ),
            ...node.parameters
        ]);
    }

    return node;
}

/**
 * Converts a Method to a Function.
 * @param node
 */
export function convertMethodToFunction(method: ts.MethodDeclaration) {
    let modifiers;
    // Convert "public" to "export"
    if (method.modifiers && method.modifiers.find((modNode) => modNode.kind === ts.SyntaxKind.PublicKeyword))
        modifiers = [ts.createToken(ts.SyntaxKind.ExportKeyword)];

    //
    // let returnType;
    // if (method.type && method.type.kind !== ts.SyntaxKind.VoidKeyword)
    //     returnType = method.type;
    // else
    //     returnType = ts.createTypeReferenceNode(ts.createIdentifier('NextScreenObject'), undefined);

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
