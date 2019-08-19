import { readFileSync, writeFileSync } from "fs";
import * as ts from "typescript";
import { convert } from "../../src/Convert";
import { TransformConfig } from "../../src/Config";
import { getClassChanges } from "../../src/Unwrapper";
import { applyTextChanges } from "../../src/TextChanger";

const path = 'tests/Unwrapper/';

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

    const fixedText = applyTextChanges(text, convert(text, file[0], false));

    const sourceFile = ts.createSourceFile(
        file[0],
        fixedText,
        ts.ScriptTarget.ES2015,
        /*setParentNodes */ true,
        ts.ScriptKind.TS
    );

    const changes = getClassChanges(sourceFile, config);
    for (const change of changes)
        console.log(JSON.stringify(text.substr(change.span.start, change.span.length)) + '\n> ' + JSON.stringify(change.newText));
    const newText = applyTextChanges(fixedText, changes);

    writeFileSync(file[1], newText);
}
