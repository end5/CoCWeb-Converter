import { Project } from "ts-morph";
import { readFileSync, writeFileSync, renameSync } from "fs";
import { convert } from "../Convert";
import { transform, fixMissingArgs } from "./Transform2";
import { walk } from "../../Walk";
import { TransformConfig } from "../../Config";

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

const fileList = walk('tests/Corruption-of-Champions-master');
const project = new Project();

const config: TransformConfig = {
    removeExtends: ['BaseContent', 'Utils', 'NPCAwareContent', 'AbstractLakeContent', 'BazaarAbstractContent', 'AbstractBoatContent', 'AbstractFarmContent', 'TelAdreAbstractContent', 'Enum', 'DefaultDict'],

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
console.log('Step 1 ...');
// Convert AS3 files to TS files
for (const file of fileList) {
    let filename = file;
    if (file.endsWith('.as')) {
        console.log('Converting ' + file);
        const text = readFileSync(file).toString();
        const newText = convert(text, file.includes('includes'));
        writeFileSync(file, newText);
        filename = file.replace('.as', '.ts');
        renameSync(file, filename);
    }
    // else
    //     console.log('Skipping ' + file);
    project.addExistingSourceFile(filename);
}
console.log(' finished');

// Step 2
const sourceFiles = project.getSourceFiles();
console.log('Step 2 ...');
for (const sourceFile of sourceFiles) {
    console.log('Transforming ' + sourceFile.getFilePath());

    let result = transform(sourceFile, config);
    while (result.state === 'restart') {
        result = transform(result.sourceFile, config);
    }

    result.sourceFile.saveSync();
}
console.log(' finished');

// Step 3
console.log('Step 3 ...');
// Continue checking for missing arguments
let missingArgs = false;
while (missingArgs) {
    missingArgs = false;
    for (const sourceFile of sourceFiles) {
        missingArgs = missingArgs || fixMissingArgs(sourceFile, config);

        sourceFile.saveSync();
    }
}
console.log(' finished');
