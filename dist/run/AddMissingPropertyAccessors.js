"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const ts_morph_1 = require("ts-morph");
function addMissingPropertyAccessors(tsConfigFilePath) {
    const project = new ts_morph_1.Project({ tsConfigFilePath });
    const languageService = project.getLanguageService();
    const tsLanguageService = languageService.compilerObject;
    const fileNames = project.getSourceFiles().map(file => file.getFilePath());
    for (const fileName of fileNames) {
        const codeActions = tsLanguageService.getCombinedCodeFix({ type: "file", fileName }, 'forgottenThisPropertyAccess', {}, {});
        const changes = codeActions.changes;
        if (changes.length > 0) {
            console.log('Fix missing property accessors ' + fileName);
            const textChanges = changes[0].textChanges;
            const text = ts.sys.readFile(fileName);
            const newText = applyTextChanges(text, textChanges);
            ts.sys.writeFile(fileName, newText);
        }
    }
}
exports.addMissingPropertyAccessors = addMissingPropertyAccessors;
function applyTextChanges(text, changes) {
    for (let i = changes.length - 1; i >= 0; i--) {
        const { span, newText } = changes[i];
        text = text.substring(0, span.start) + newText + text.substring(span.start + span.length);
    }
    return text;
}
exports.applyTextChanges = applyTextChanges;
