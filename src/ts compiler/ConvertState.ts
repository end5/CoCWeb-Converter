import * as ts from "typescript";

export interface ConvertState {
    requiresPlayer: ts.Declaration[];
    // outputTextCount: number;
    sourceFile: ts.SourceFile;
}
