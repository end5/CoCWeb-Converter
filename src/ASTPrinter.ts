import { readFileSync } from "fs";
import * as ts from "typescript";

// const fileNames = process.argv.slice(2);
const fileNames = ['tests/test2.ts'];
fileNames.forEach((fileName) => {
    // Parse a file
    const sourceFile = ts.createSourceFile(
        fileName,
        readFileSync(fileName).toString(),
        ts.ScriptTarget.ES2015,
    /*setParentNodes */ true
    );

    let str = '';

    function printAST(node: ts.Node, indent: number) {
        str = ' '.repeat(indent) + ts.SyntaxKind[node.kind];

        if (ts.isSourceFile(node)) {
            str += ' ' + !!node.parent;
        }

        if (ts.isHeritageClause(node)) {
            if (node.token === ts.SyntaxKind.ExtendsKeyword)
                str += ' extends';
            if (node.token === ts.SyntaxKind.ImplementsKeyword)
                str += ' implements';
        }

        console.log(str + ': ' + node.getText());
        node.forEachChild((n) => printAST(n, indent + 1));
    }
    printAST(sourceFile, 0);
});
