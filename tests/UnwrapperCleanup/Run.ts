import { readFileSync, writeFileSync } from "fs";
import * as ts from "typescript";
import { convert } from "../../src/Convert";
import { TransformConfig } from "../../src/Config";
import { getClassChanges } from "../../src/Unwrapper";
import { applyTextChanges } from "../../src/TextChange";
import { getCleanupChanges } from "../../src/UnwrapperCleanUp";

const path = 'tests/UnwrapperCleanup/';

const files: [string, string][] = [[path + "test.as", path + "test.ts"]];
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

for (const file of files) {
    const text = readFileSync(file[0]).toString();

    let newText = applyTextChanges(text, convert(text, false));

    let sourceFile = ts.createSourceFile(
        file[0],
        newText,
        ts.ScriptTarget.ES2015,
        /*setParentNodes */ true,
        ts.ScriptKind.TS
    );

    newText = applyTextChanges(newText, getClassChanges(sourceFile, config));

    sourceFile = ts.createSourceFile(
        file[0],
        newText,
        ts.ScriptTarget.ES2015,
        /*setParentNodes */ true,
        ts.ScriptKind.TS
    );

    newText = applyTextChanges(newText, getCleanupChanges(sourceFile));

    writeFileSync(file[1], newText);
}
