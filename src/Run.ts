import { readFileSync, writeFileSync, renameSync } from "fs";
import * as ts from "typescript";
import { Project } from "ts-morph";
import { TransformConfig } from "./Config";
import { convert } from "./Convert";
import { getClassChanges } from "./Unwrapper";
import { applyTextChanges } from "./TextChanger";
import { getCleanupChanges } from "./UnwrapperCleanUp";
// import { fixMissingArgs } from "./Fix";

function createSourceFile(path: string, text: string) {
    return ts.createSourceFile(
        path,
        text,
        ts.ScriptTarget.ES2015,
        /*setParentNodes */ true,
        ts.ScriptKind.TS
    );
}

export function run(fileList: string[], config: TransformConfig, rename?: boolean) {
    const project = new Project();

    // Stage 1
    console.log('Stage 1 ...');

    for (const file of fileList) {
        let curFile = file;
        if (file.endsWith('.as')) {
            const text = readFileSync(file).toString();

            console.log('Converting ' + file);

            curFile = file.replace('.as', '.ts');

            let changes = convert(text, file, file.includes('includes'));
            let newText = applyTextChanges(text, changes);
            let sourceFile = createSourceFile(curFile, newText);

            console.log('Unwrapping');

            changes = getClassChanges(sourceFile, config);
            newText = applyTextChanges(newText, changes);
            sourceFile = createSourceFile(curFile, newText);

            console.log('Unwrap Cleanup');

            changes = getCleanupChanges(sourceFile);
            newText = applyTextChanges(newText, changes);
            sourceFile = createSourceFile(curFile, newText);

            if (rename) {
                writeFileSync(file, newText);
                renameSync(file, curFile);
            }
            else {
                writeFileSync(curFile, newText);
            }
        }
        // else
        //     console.log('Skipping ' + file);
        project.addExistingSourceFile(curFile);
    }

    console.log(' finished');

    // Stage 2
    console.log('Stage 2 ...');

    const sourceFiles = project.getSourceFiles();
    for (const sourceFile of sourceFiles) {
        console.log('Formatting ' + sourceFile.getFilePath());

        sourceFile.formatText({
            ensureNewLineAtEndOfFile: true,
        });

        sourceFile.fixMissingImports();

    }

    console.log(' finished');

    // Stage 3
    console.log('Stage 3 ...');

    // let foundProblem = true;
    // while (foundProblem) {
    //     foundProblem = false;
    //     for (const sourceFile of sourceFiles) {
    //         console.log('Fixing ' + sourceFile.getFilePath());

    //         while (fixMissingArgs(sourceFile, config))
    //             foundProblem = true;
    //     }
    // }

    project.saveSync();

    console.log(' finished');
}
