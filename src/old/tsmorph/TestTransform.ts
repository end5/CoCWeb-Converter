import { Project, Node } from "ts-morph";
import { readFileSync, writeFileSync } from "fs";
import { convert } from "../Convert";
import { transform } from "./Transform2";
import { TransformConfig } from "../../Config";
import { logToConsole } from "./Log";

// const project = new Project({
//     tsConfigFilePath: "tests/testconfig.json",
//     skipFileDependencyResolution: true
// });
const project = new Project();
const files: [string, string][] = [["tests/test3.as", "tests/test3.ts"]];

// const sourceFiles = project.getSourceFiles();
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

logToConsole();

for (const file of files) {
    const text = readFileSync(file[0]).toString();
    const fixedText = convert(text, false);
    const sourceFile = project.createSourceFile("tests/temp.ts", fixedText);

    let result = transform(sourceFile, config);
    while (result.state === 'restart') {
        console.log(result.sourceFile.getFullText());
        result = transform(result.sourceFile, config);
    }
    printTree(result.sourceFile);

    writeFileSync(file[1], result.sourceFile.getFullText());
}

function printTree(node: Node, indent = 0) {
    // console.log(' '.repeat(indent) + node.getKindName() + ' ' + (node.getLeadingCommentRanges().length > 0 ? '>' : '') + ' ' + (node.getTrailingCommentRanges().length > 0 ? '<' : ''));
    for (const child of node.getChildren())
        printTree(child, indent + 2);
}
