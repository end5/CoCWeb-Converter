import * as ts from "typescript";
import { applyTextChanges } from "./TextChanges";

export function fixConstructor(file: string, text: string) {
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);

    const changes: ts.TextChange[] = [];

    for (const statement of sourceFile.statements) {
        if (ts.isClassDeclaration(statement)) {
            const className = statement.name ? statement.name.getText() : '';

            // Fix methods
            for (const member of statement.members) {
                if (ts.isMethodDeclaration(member)) {
                    if (className === member.name.getText()) {
                        // Convert to constructor
                        changes.push({
                            span: {
                                start: member.name.getStart(),
                                length: member.name.getWidth()
                            },
                            newText: 'constructor'
                        });
                    }
                }
            }
        }
    }

    return applyTextChanges(text, changes);
}
