import * as ts from "typescript";
import { convertClassNode } from "./Convert/ClassNode";

export function transformer(context: ts.TransformationContext) {
    return (rootNode: ts.SourceFile) => {
        function visit(node: ts.Node) {
            if (ts.isClassDeclaration(node)) {
                return convertClassNode(rootNode, node, context);
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
