import { Project } from "ts-morph";
import { readFileSync, writeFileSync } from "fs";
import { convert } from "./Convert";
import { transform } from "./Transform";

// const project = new Project({
//     tsConfigFilePath: "tests/testconfig.json",
//     skipFileDependencyResolution: true
// });
const project = new Project();
const files: [string, string][] = [["tests/test3.as", "tests/test3.ts"]];

// const sourceFiles = project.getSourceFiles();

for (const file of files) {
    const text = readFileSync(file[0]).toString();
    const fixedText = convert(text);
    const sourceFile = project.createSourceFile("tests/temp.ts", fixedText);

    const newSourceFile = transform(sourceFile);

    newSourceFile.formatText({
        ensureNewLineAtEndOfFile: true,
    });

    writeFileSync(file[1], newSourceFile.getFullText());
}
