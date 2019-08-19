import { readFileSync, writeFileSync } from "fs";
import * as ts from "typescript";
import { convert } from "../../src/Convert";
import { TransformConfig } from "../../src/Config";
import { getClassChanges } from "../../src/Unwrapper";
import { applyTextChanges } from "../../src/TextChanger";
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

    let newText = applyTextChanges(text, convert(text, file[0], false));

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

    const changes = getCleanupChanges(sourceFile);
    for (const change of changes)
        console.log(JSON.stringify(text.substr(change.span.start, change.span.length)) + '\n> ' + JSON.stringify(change.newText));

    newText = applyTextChanges(newText, changes);

    writeFileSync(file[1], newText);
}
