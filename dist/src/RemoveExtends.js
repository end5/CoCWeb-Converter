"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
function removeExtends(node, extendsList) {
    let changes = [];
    for (const statement of node.statements) {
        if (ts.isClassDeclaration(statement)) {
            changes = changes.concat(extendsChanges(statement, extendsList));
        }
    }
    return changes;
}
exports.removeExtends = removeExtends;
function getIdentifiers(node) {
    if (ts.isIdentifier(node))
        return [node];
    let identifiers = [];
    node.forEachChild((child) => {
        identifiers = identifiers.concat(getIdentifiers(child));
    });
    return identifiers;
}
function extendsChanges(node, extendsList) {
    const changes = [];
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
