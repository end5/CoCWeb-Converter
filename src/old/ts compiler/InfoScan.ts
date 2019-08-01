import * as ts from "typescript";
import { ConvertState } from "./ConvertState";
import { hasIdentifier } from "./Utils";

export function infoScan(root: ts.SourceFile) {
    const info: ConvertState = {
        requiresPlayer: [],
        sourceFile: root
    };

    function visit(node: ts.Node) {
        ts.forEachChild(node, visit);
        if ((ts.isFunctionDeclaration(node) || ts.isClassElement(node)) && hasIdentifier(node, 'player')) {
            info.requiresPlayer.push(node);
        }
    }

    ts.forEachChild(root, visit);

    // console.log(info.requiresPlayer.map((child) => getName2(child)));

    return info;
}
