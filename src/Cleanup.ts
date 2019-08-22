import * as ts from "typescript";

export function cleanupChanges(node: ts.SourceFile) {
    const changes: ts.TextChange[] = [];

    for (const statement of node.statements) {
        if (ts.isClassDeclaration(statement)) {
            if (hasEmptyClassBody(statement)) {
                // Remove class and replace it with any comments found inside of it
                changes.push(replaceWithComments(statement));
            }
            else {
                for (const member of statement.members) {
                    // Method has an empty body
                    if (ts.isMethodDeclaration(member) && hasEmptyMethodBody(member)) {
                        // Remove method and replace it with any comments found inside of it
                        return [replaceWithComments(node)];
                    }
                }
            }
        }
    }

    return changes;
}

/**
 * Check if the class node has an empty body
 * @param node
 */
function hasEmptyClassBody(node: ts.ClassDeclaration) {
    // Looking for token pattern
    // OpenBrace - no children
    // SyntaxList - no children
    // CloseBrace - no children

    const children = node.getChildren();
    let index = 0;
    while (index < children.length && children[index].kind !== ts.SyntaxKind.OpenBraceToken)
        index++;

    if (index + 2 >= node.getChildCount())
        return false;

    return children[index].kind === ts.SyntaxKind.OpenBraceToken && children[index].getChildCount() === 0 &&
        children[index + 1].kind === ts.SyntaxKind.SyntaxList && children[index + 1].getChildCount() === 0 &&
        children[index + 2].kind === ts.SyntaxKind.CloseBraceToken && children[index + 2].getChildCount() === 0;
}

/**
 * Check if the method node has an empty body ignoring whitespace.
 * @param node
 */
function hasEmptyMethodBody(node: ts.MethodDeclaration) {
    const body = node.body;
    if (!body) return false;

    // Looking for token pattern
    // OpenBrace - no children
    // SyntaxList - no children
    // CloseBrace - no children

    const children = body.getChildren();
    let index = 0;
    while (index < children.length && children[index].kind !== ts.SyntaxKind.OpenBraceToken)
        index++;

    if (index + 2 >= body.getChildCount())
        return false;

    return children[index].kind === ts.SyntaxKind.OpenBraceToken && children[index].getChildCount() === 0 &&
        children[index + 1].kind === ts.SyntaxKind.SyntaxList && children[index + 1].getChildCount() === 0 &&
        children[index + 2].kind === ts.SyntaxKind.CloseBraceToken && children[index + 2].getChildCount() === 0;
}

const commentRegex = /\/\*[\s\S]*?\*\/|\/\/.*/g;

/**
 * Returns a text change that replaces the text with any comments found inside of it.
 * @param node
 */
export function replaceWithComments(node: ts.Node): ts.TextChange {
    const comments = node.getText().match(commentRegex);
    // Remove method and replace it with any comments found inside of it
    return {
        span: {
            start: node.getStart(),
            length: node.getWidth()
        },
        newText: comments ? comments.join('\n') : ''
    };
}
