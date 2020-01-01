import * as ts from "typescript";
/**
 * Creates new text by applying changes in order.
 * Changes need to be in descending order.
 * @param text
 * @param changes
 */
export declare function applyTextChanges(text: string, changes: ts.TextChange[]): string;
export declare function printTextChanges(text: string, changes: ts.TextChange[]): void;
