import * as ts from "typescript";
export declare function cleanupChanges(node: ts.SourceFile): ts.TextChange[];
/**
 * Returns a text change that replaces the text with any comments found inside of it.
 * @param node
 */
export declare function replaceWithComments(node: ts.Node): ts.TextChange;
