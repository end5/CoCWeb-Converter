import { readFileSync, writeFileSync } from "fs";
import * as ts from "typescript";
import { convert } from "../../src/Convert";
import { TransformConfig } from "../../src/Config";
import { getTextChanges } from "../../src/ClassUnwrapper";
import { applyTextChanges } from "../../src/TextChange";

const files: [string, string][] = [["tests/test3.as", "tests/test3.ts"]];
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

    const fixedText = convert(text, false);

    const sourceFile = ts.createSourceFile(
        file[0],
        fixedText,
        ts.ScriptTarget.ES2015,
        /*setParentNodes */ true,
        ts.ScriptKind.TS
    );

    const changes = getTextChanges(sourceFile, config);

    const newText = applyTextChanges(fixedText, changes);

    writeFileSync(file[1], newText);
}
