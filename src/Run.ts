import { readFileSync, writeFileSync } from "fs";
import * as ts from "typescript";
import { transformer } from "./Transformer";

// const fileNames = process.argv.slice(2);
const fileNames = ['tests/test.ts'];
fileNames.forEach((fileName) => {

    const resultFilename = fileName.replace('.ts', '_mod.ts');
    const sourceFile = ts.createSourceFile(
        fileName,
        readFileSync(fileName).toString(),
        ts.ScriptTarget.ES2015,
        /*setParentNodes */ true,
        ts.ScriptKind.TS
    );

    const result = ts.transform(sourceFile, [transformer]);

    const transformedSourceFile = result.transformed[0];
    // const transformedSourceFile = sourceFile;

    const printer = ts.createPrinter({
        removeComments: false,
        newLine: ts.NewLineKind.LineFeed
    });
    const newContent = printer.printFile(transformedSourceFile);

    result.dispose();

    writeFileSync(resultFilename, newContent);

});
