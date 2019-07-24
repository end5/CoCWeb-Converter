import * as ts from "typescript";

/**
 * Recursively searches for an Identifier that matches the text
 * @param node
 * @param text
 */
export function hasIdentifier(node: ts.Node, text: string): boolean {
    if (ts.isIdentifier(node) && node.text === text)
        return true;

    let match = false;
    node.forEachChild((child) => {
        match = match || hasIdentifier(child, text);
    });

    // console.log(ts.SyntaxKind[node.kind] + ': ' + match);
    return match;
}

export function doesExtend(node: ts.HeritageClause, text: string) {
    if (node.token === ts.SyntaxKind.ExtendsKeyword) {
        return hasIdentifier(node, text);
    }
    return false;
}

export function doesImplement(node: ts.HeritageClause, text: string) {
    if (node.token === ts.SyntaxKind.ImplementsKeyword) {
        return hasIdentifier(node, text);
    }
    return false;
}

export function hasName(node: ts.PropertyName, text: string) {
    if (ts.isComputedPropertyName(node))
        return false;
    return node.text === text;
}

export function getName(node: ts.ClassElement) {
    if (!node.name)
        throw new Error('Name does not exist');
    if (ts.isComputedPropertyName(node.name))
        throw new Error('Tried to get name of ComputedProperty');
    return node.name.text;
}

export function getName2(node: ts.Declaration | ts.Expression) {
    const nameNode = ts.getNameOfDeclaration(node);
    if (!nameNode)
        return;
    if (ts.isArrayBindingPattern(nameNode))
        throw new Error('Tried to get name of ArrayBindingPattern');
    if (ts.isObjectBindingPattern(nameNode))
        throw new Error('Tried to get name of ObjectBindingPattern');
    if (ts.isComputedPropertyName(nameNode))
        throw new Error('Tried to get name of ComputedProperty');
    return nameNode.text;
}

export function addComments<S extends ts.Node, D extends ts.Node>(text: string, sourceNode: S, destNode: D) {
    addLeadingComments(text, sourceNode, destNode);
    addTrailingComments(text, sourceNode, destNode);
    return destNode;
}

export function addLeadingComments(text: string, sourceNode: ts.Node, destNode: ts.Node) {
    const leadingComments = ts.getLeadingCommentRanges(text, sourceNode.pos);
    if (leadingComments) {
        for (const comment of leadingComments) {
            const commentText = text.slice(
                comment.pos + 2,
                comment.end - (comment.kind === ts.SyntaxKind.MultiLineCommentTrivia ? 2 : 0)
            );
            ts.addSyntheticLeadingComment(destNode, comment.kind, commentText, comment.hasTrailingNewLine);
        }
    }
}

export function addTrailingComments(text: string, sourceNode: ts.Node, destNode: ts.Node) {
    const trailingComments = ts.getTrailingCommentRanges(text, sourceNode.pos);
    if (trailingComments)
        for (const comment of trailingComments) {
            const commentText = text.slice(
                comment.pos + 2,
                comment.end - (comment.kind === ts.SyntaxKind.MultiLineCommentTrivia ? 2 : 0)
            );
            ts.addSyntheticTrailingComment(destNode, comment.kind, commentText, comment.hasTrailingNewLine);
            // console.log(text.slice(comment.pos, comment.end));
        }
}
