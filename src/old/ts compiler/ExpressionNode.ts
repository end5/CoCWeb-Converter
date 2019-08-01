import * as ts from "typescript";
import { getName2 } from "./Utils";
import { ConvertState } from "./ConvertState";

export function fixExpressionNode(node: ts.ExpressionStatement, info: ConvertState) {
    const expr = node.expression;
    if (ts.isCallExpression(expr)) {
        /**
         * this.outputText(this.images.showImage("...")) -> showImage("...")
         *
         * Call                         expr
         * |_ Prop                      expr.expression
         * | |_ This = 'this'           expr.expression.expression
         * | |_ Name = 'outputText'     expr.expression.name
         * |_ Call                      expr.arguments[0]
         *   |_ Prop                    expr.arguments[0].expression
         *   | |_ Prop                  expr.arguments[0].expression.expression
         *   | | |_ This = 'this'       expr.arguments[0].expression.expression.expression
         *   | | |_ Name = 'images'     expr.arguments[0].expression.expression.name
         *   | |_ Name = 'showImage'    expr.arguments[0].expression.name
         *   |_ String?                 expr.arguments[0].arguments[0]
         */
        // if (
        //     ts.isPropertyAccessExpression(expr.expression) &&
        //     expr.expression.expression.kind === ts.SyntaxKind.ThisKeyword
        // ) {
        //     if (ts.isIdentifier(expr.expression.name) && expr.expression.name.text === 'outputText') {
        //         info.outputTextCount++;

        //         // Process for image
        //         const firstArg = expr.arguments[0];
        //         if (
        //             ts.isCallExpression(firstArg) &&
        //             ts.isPropertyAccessExpression(firstArg.expression) &&
        //             ts.isPropertyAccessExpression(firstArg.expression.expression) &&
        //             firstArg.expression.expression.expression.kind === ts.SyntaxKind.ThisKeyword &&
        //             ts.isIdentifier(firstArg.expression.expression.name) && firstArg.expression.expression.name.text === 'images' &&
        //             ts.isIdentifier(firstArg.expression.name) && firstArg.expression.name.text === 'showImage'
        //         ) {
        //             // console.log('found showImage');
        //             return addComments(
        //                 info.sourceFile.text,
        //                 node,
        //                 ts.createExpressionStatement(
        //                     ts.createCall(
        //                         ts.createIdentifier('showImage'),
        //                         undefined,
        //                         [firstArg.arguments[0]]
        //                     )
        //                 )
        //             );
        //         }
        //         // If first arg, remove this
        //         else if (firstArg)
        //             return addComments(
        //                 info.sourceFile.text,
        //                 node, ts.createExpressionStatement(
        //                     ts.createBinary(
        //                         ts.createIdentifier('outputText'),
        //                         ts.createToken(ts.SyntaxKind.FirstCompoundAssignment),
        //                         expr.arguments[0]
        //                     )
        //                 )
        //             );
        //         // No first arg, remove completely
        //         else
        //             return;
        //     }

        // }

        fixPlayerArgs(expr, info);
    }
    return node;
}

export function fixPlayerArgs(node: ts.CallExpression, info: ConvertState) {
    // console.log(info.requiresPlayer.map((child) => getName2(child)));
    const names = info.requiresPlayer.filter((child) => getName2(child) !== undefined).map((child) => getName2(child)) as string[];

    const name = getName2(node.expression);
    if (
        name && ~names.indexOf(name) &&
        (
            node.arguments.length === 0 ||
            (
                node.arguments.length > 0 &&
                ts.isIdentifier(node.arguments[0]) &&
                (node.arguments[0] as ts.Identifier).text !== 'player'
            )
        )
    ) {
        console.log('Modifying ' + name);
        node.arguments = ts.createNodeArray([ts.createIdentifier('player'), ...node.arguments]);
    }
}
