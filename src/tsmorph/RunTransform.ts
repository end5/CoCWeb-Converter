import { Project } from "ts-morph";
import { readFileSync, writeFileSync, renameSync } from "fs";
import { convert } from "./Convert";
import { transform } from "./Transform";
import { walk } from "./Walk";
import { fixMissingArgs } from "./Transform";
import { TransformConfig } from "./Config";

/*
    Steps
    1. Convert AS3 to valid TS syntax using regexps
    2. Transform TS file
        A. Transform class
            a. Find and transform method to constructor. Remove it if empty.
            b. Add missing parameters to method
            c. Transform methods to functions
        B. Remove empty classes
        C. Format and import
    3. Fix missing arguments
*/

const fileList = walk(process.argv0);
const project = new Project();

const config: TransformConfig = {
    removeExtends: ["BaseContent", "Utils", "NPCAwareContent", "AbstractLakeContent", "BazaarAbstractContent", "AbstractBoatContent", "AbstractFarmContent", "TelAdreAbstractContent"],

    ignoreClasses: [],

    ignoreInterfaceMethods: {
        TimeAwareInterface: ['timeChange', 'timeChangeLarge']
    },

    identiferToParamPairs: [
        { name: 'player', type: 'Player' },
        { name: 'monster', type: 'Monster' }
    ],
};

// Step 1
// Convert AS3 files to TS files
for (const file of fileList) {
    const text = readFileSync(file).toString();
    const newText = convert(text, file.includes('includes'));
    writeFileSync(file, newText);
    const newFilename = file.replace('.as', '.ts');
    renameSync(file, newFilename);
    project.addExistingSourceFile(newFilename);
}

const sourceFiles = project.getSourceFiles();

// Step 2
for (const sourceFile of sourceFiles) {
    const newSourceFile = transform(sourceFile, config);

    newSourceFile.saveSync();
}

// Step 3
// Continue checking for missing arguments
let missingArgs = false;
while (missingArgs) {
    missingArgs = false;
    for (const sourceFile of sourceFiles) {
        missingArgs = missingArgs || fixMissingArgs(sourceFile, config);

        sourceFile.saveSync();
    }
}
