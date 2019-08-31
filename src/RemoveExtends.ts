import * as ts from "typescript";

export function removeExtends(node: ts.SourceFile, extendsList: string[]) {
    let changes: ts.TextChange[] = [];

    for (const statement of node.statements) {
        if (ts.isClassDeclaration(statement)) {
            changes = changes.concat(extendsChanges(statement, extendsList));
        }
    }

    return changes;
}

function getIdentifiers(node: ts.Node) {
    if (ts.isIdentifier(node))
        return [node];
    let identifiers: ts.Identifier[] = [];
    node.forEachChild((child) => {
        identifiers = identifiers.concat(getIdentifiers(child));
    });
    return identifiers;
}

function extendsChanges(node: ts.ClassDeclaration, extendsList: string[]) {
    const changes: ts.TextChange[] = [];
    const heritageClauses = node.heritageClauses;

    // Fix extends
    if (heritageClauses)
        for (const heritageClause of heritageClauses) {
            // Remove extends if match in config
            if (heritageClause.token === ts.SyntaxKind.ExtendsKeyword) {
                const identifiers = getIdentifiers(heritageClause);
                // Only care about the first one
                if (identifiers.length > 0 && ~extendsList.indexOf(identifiers[0].getText()))
                    changes.push({
                        span: {
                            start: node.getStart(),
                            length: node.getWidth()
                        },
                        newText: ''
                    });
            }
        }
    return changes;
}
