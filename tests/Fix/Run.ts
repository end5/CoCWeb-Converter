import { Project } from "ts-morph";
import { TransformConfig } from "../../src/Config";
import { fixMissingArgs } from "../../src/Fix";

const path = 'tests/Fix/';

const files: [string, string][] = [["test.ts", "test2.ts"]];
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

const project = new Project();

for (const file of files) {
    const sourceFile = project.addExistingSourceFile(path + file[0]);
    sourceFile.copyImmediatelySync(file[1], { overwrite: true });
    project.removeSourceFile(sourceFile);
}

const sourceFiles = project.getSourceFiles();

let foundProblem = true;
while (foundProblem) {
    foundProblem = false;
    for (const sourceFile of sourceFiles) {
        console.log('Fixing ' + sourceFile.getFilePath());

        while (fixMissingArgs(sourceFile, config))
            foundProblem = true;
    }
}

project.saveSync();
