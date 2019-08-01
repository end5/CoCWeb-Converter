import * as ts from "typescript";
import { ConvertState } from "./ConvertState";
import { fixBlockInnards } from "./BlockNode";
import { fixPlayerParams } from "./MethodNode";

export function fixFunctionNode(node: ts.FunctionDeclaration, context: ts.TransformationContext, info: ConvertState) {
    if (node.body)
        node.body = fixBlockInnards(node.body, context, info);

    fixPlayerParams(node, info);

    return node;
}
