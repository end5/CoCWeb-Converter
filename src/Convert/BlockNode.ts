import * as ts from "typescript";
import { hasIdentifier, getName } from "../Utils";
import { ClassInfo } from "./ClassNode";

export function convertBlockInnards(block: ts.Block, context: ts.TransformationContext, info: ClassInfo) {
    let outputTextFound = 0;

    function visit(node: ts.Node) {
        node = ts.visitEachChild(node, visit, context);

        if (ts.isPropertyAccessExpression(node))
            if (node.expression.kind === ts.SyntaxKind.ThisKeyword) {

                // function checkName(name: string) {
                //     return name === (node as ts.PropertyAccessExpression).name.text;
                // }

                // if (thisRemovalList.find(checkName) || otherMethods.find(checkName))
                //     return node.name;
                return node.name;
            }

        if (ts.isCallExpression(node)) {
            if (info.requiresPlayer.find((child) => hasIdentifier(node, getName(child))))
                node.arguments = ts.createNodeArray([ts.createIdentifier('player'), ...node.arguments]);

            if (hasIdentifier(node, 'outputText'))
                if (node.arguments.length > 0) {
                    outputTextFound++;
                    return ts.createBinary(
                        ts.createIdentifier('outputText'),
                        ts.createToken(ts.SyntaxKind.FirstCompoundAssignment),
                        node.arguments[0]
                    );
                }
                else
                    return;
        }

        return node;
    }

    block = ts.visitEachChild(block, visit, context);

    console.log(outputTextFound);

    // Add "let outputText = '';" to that start of the block
    if (outputTextFound) {
        block = ts.createBlock(
            [createOutputTextStatement(), ...block.statements]
        );
    }

    return block;
}

// Creates "let outputText = '';" Statement node
function createOutputTextStatement() {
    return ts.createVariableStatement(
        undefined,
        ts.createVariableDeclarationList(
            [
                ts.createVariableDeclaration(
                    ts.createIdentifier('outputText'),
                    undefined,
                    ts.createStringLiteral('')
                )
            ],
            ts.NodeFlags.Let
        )
    );
}
