import { SourceFile } from "ts-morph";
/**
 * Compares each function call to its definition and adds any missing parameters.
 * Returns true if a change happened.
 * @param sourceFile
 * @param paramPairs
 */
export declare function fixMissingArgs(sourceFile: SourceFile, paramPairs: [string, string][]): boolean;
