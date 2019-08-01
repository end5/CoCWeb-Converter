import * as ts from "typescript";
import { fixExpressionNode } from "./ExpressionNode";
import { ConvertState } from "./ConvertState";
import { addComments } from "./Utils";

export function removeThisKeyword(block: ts.Block, text: string, context: ts.TransformationContext) {
    function removeThis(node: ts.Node) {
        node = ts.visitEachChild(node, removeThis, context);

        if (ts.isPropertyAccessExpression(node))
            if (node.expression.kind === ts.SyntaxKind.ThisKeyword) {
                return addComments(text, node.name, node.name);
            }
        return node;
    }

    return ts.visitEachChild(block, removeThis, context);
}

function fixExpressionNodes(block: ts.Block, context: ts.TransformationContext, info: ConvertState) {
    function visit(node: ts.Node) {
        node = ts.visitEachChild(node, visit, context);

        if (ts.isExpressionStatement(node)) {
            return fixExpressionNode(node, info);
        }
        return node;
    }

    // Handle transforms and replacement
    return ts.visitEachChild(block, visit, context);
}

export function fixBlockInnards(block: ts.Block, context: ts.TransformationContext, info: ConvertState) {
    // info.outputTextCount = 0;

    // Handle transforms and replacement
    block = fixExpressionNodes(block, context, info);

    // Remove this on rest
    block = removeThisKeyword(block, info.sourceFile.text, context);

    // console.log('OutputText: ' + info.outputTextCount);

    // Add "let outputText = '';" to that start of the block
    // if (info.outputTextCount) {
    //     block = addComments(
    //         info.sourceFile.text,
    //         block,
    //         ts.createBlock(
    //             [
    //                 createOutputTextStatement(),
    //                 ...block.statements,
    //                 createScreenReturn()
    //             ],
    //             true
    //         )
    //     );
    // }

    return block;
}

// Creates "let outputText = '';" Statement node
// function createOutputTextStatement() {
//     return ts.createVariableStatement(
//         undefined,
//         ts.createVariableDeclarationList(
//             [
//                 ts.createVariableDeclaration(
//                     ts.createIdentifier('outputText'),
//                     undefined,
//                     ts.createStringLiteral('')
//                 )
//             ],
//             ts.NodeFlags.Let
//         )
//     );
// }

// function createScreenReturn() {
//     return ts.createReturn(
//         ts.createObjectLiteral(
//             [
//                 ts.createPropertyAssignment(
//                     ts.createIdentifier('text'),
//                     ts.createIdentifier('outputText')
//                 )
//             ],
//             false
//         )
//     );
// }
