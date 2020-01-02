import * as ts from "typescript";
import { Project } from "ts-morph";

interface TextChange {
    span: TextSpan;
    newText: string;
}

interface TextSpan {
    start: number;
    length: number;
}

const tsConfigFilePath = process.argv[2];

const project = new Project({ tsConfigFilePath });
const languageService = project.getLanguageService();
const tsLanguageService = languageService.compilerObject;
const fileNames = project.getSourceFiles().map(file => file.getFilePath());
for (const fileName of fileNames) {
    const codeActions = tsLanguageService.getCombinedCodeFix({ type: "file", fileName }, 'forgottenThisPropertyAccess', {}, {});
    const changes = codeActions.changes;
    if (changes.length > 0) {
        console.log('Fix missing property accessors ' + fileName);
        const textChanges = changes[0].textChanges as TextChange[];
        const text = ts.sys.readFile(fileName)!;
        const newText = applyTextChanges(text, textChanges);
        ts.sys.writeFile(fileName, newText);
    }
}

export function applyTextChanges(text: string, changes: TextChange[]): string {
    for (let i = changes.length - 1; i >= 0; i--) {
        const { span, newText } = changes[i];
        text = text.substring(0, span.start) + newText + text.substring(span.start + span.length);
    }
    return text;
}
