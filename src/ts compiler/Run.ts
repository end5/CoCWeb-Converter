import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import * as ts from "typescript";
import { transformer } from "./Transformer";
import { walkSync } from "walk";
// import { fixText } from "./regex/Converter";

// const fileNames = process.argv.slice(2);
// const fileNames = ['tests/test_mod.ts'];
// fileNames.forEach((fileName) => {
//     fixTSFile(fileName);
// });

const dir = 'tests\\CoCWeb';
walkSync(dir, {
    listeners: {
        file: (root, fileStats, next) => {
            const path = root + '\\' + fileStats.name;
            console.log(path);
            fixTSFile(path, path.replace('CoCWeb', 'CoCWeb_res'));
        }
    }
});

function fixTSFile(path: string, pathOut: string) {
    const text = readFileSync(path).toString();

    // text = fixText(text);

    const sourceFile = ts.createSourceFile(
        path,
        text,
        ts.ScriptTarget.ES2015,
        /*setParentNodes */ true,
        ts.ScriptKind.TS
    );

    const result = ts.transform(sourceFile, [transformer]);
    // const result = ts.transform(sourceFile, [(context) => (node) => node]);

    const transformedSourceFile = result.transformed[0];
    // const transformedSourceFile = sourceFile;

    const printer = ts.createPrinter({
        removeComments: false,
        newLine: ts.NewLineKind.LineFeed
    });
    const newContent = printer.printFile(transformedSourceFile);

    result.dispose();

    const splitPath = pathOut.split('\\');
    let curPath = '';
    for (const pathPart of splitPath) {
        curPath += pathPart;
        if (!pathPart.endsWith('.ts')) {
            curPath += '\\';
            if (!existsSync(curPath)) {
                mkdirSync(curPath);
            }
        }
    }

    writeFileSync(pathOut, newContent);
}
