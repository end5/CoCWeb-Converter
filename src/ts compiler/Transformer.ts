import * as ts from "typescript";
import { fixClassNode } from "./ClassNode";
import { infoScan } from "./InfoScan";
import { fixFunctionNode } from "./FunctionNode";

export function transformer(context: ts.TransformationContext) {
    return (rootNode: ts.SourceFile) => {
        const info = infoScan(rootNode);

        function visit(node: ts.Node) {
            if (ts.isClassDeclaration(node)) {
                return fixClassNode(node, context, info);
            }

            if (ts.isFunctionDeclaration(node)) {
                node = fixFunctionNode(node, context, info);
            }
            return node;
        }

        return ts.visitEachChild(rootNode, visit, context);
        //  ts.updateSourceFileNode(
        //     rootNode,
        //     newStatements,
        //     rootNode.isDeclarationFile,
        //     rootNode.referencedFiles,
        //     rootNode.typeReferenceDirectives,
        //     rootNode.hasNoDefaultLib,
        //     rootNode.libReferenceDirectives
        // );
    };
}
