import * as ts from "typescript";
import { replaceWithComments } from "./Unwrapper";

export function getCleanupChanges(node: ts.SourceFile) {
    const changes: ts.TextChange[] = [];

    for (const statement of node.statements) {
        if (ts.isClassDeclaration(statement) && hasEmptyBody(statement)) {
            // Remove class and replace it with any comments found inside of it
            changes.push(replaceWithComments(statement));
        }
    }

    return changes;
}

/**
 * Check if the class node has an empty body
 * @param node
 */
function hasEmptyBody(node: ts.ClassDeclaration) {
    // Looking for token pattern
    // OpenBrace - no children
    // SyntaxList - no children
    // CloseBrace - no children

    const children = node.getChildren();
    let index = 0;
    while (children[index].kind !== ts.SyntaxKind.OpenBraceToken)
        index++;

    if (index + 2 >= node.getChildCount())
        return false;

    return children[index].kind === ts.SyntaxKind.OpenBraceToken && children[index].getChildCount() === 0 &&
        children[index + 1].kind === ts.SyntaxKind.SyntaxList && children[index + 1].getChildCount() === 0 &&
        children[index + 2].kind === ts.SyntaxKind.CloseBraceToken && children[index + 2].getChildCount() === 0;
}
