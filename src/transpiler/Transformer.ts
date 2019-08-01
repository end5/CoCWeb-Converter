import * as ts from "typescript";
import { TransformConfig } from "../tsmorph/Config";

export function getTextChanges(node: ts.SourceFile, config: TransformConfig) {
    let changes: ts.TextChange[] = [];

    for (const statement of node.statements) {
        if (ts.isClassDeclaration(statement)) {
            changes = changes.concat(getClassTextChanges(statement, config));
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

function getClassTextChanges(node: ts.ClassDeclaration, config: TransformConfig) {
    let changes: ts.TextChange[] = [];
    const className = node.name ? node.name.getText() : '';
    const heritageClauses = node.heritageClauses;
    let implementsNames: string[] = [];

    // Fix extends and get implements names
    if (heritageClauses) {
        for (const heritageClause of heritageClauses) {
            const result = getHeritageTextChanges(heritageClause, config);
            if (result)
                changes.push(result);

            if (heritageClause.token === ts.SyntaxKind.ImplementsKeyword) {
                // Get implements for later step
                implementsNames = getIdentifiers(heritageClause).map((identifier) => identifier.getText());
            }
        }
    }

    // Fix methods
    for (const member of node.members) {
        if (ts.isMethodDeclaration(member)) {
            changes = changes.concat(getMethodChanges(member, className, implementsNames, config));
        }
    }

    return changes;
}

function getHeritageTextChanges(node: ts.HeritageClause, config: TransformConfig) {
    // Remove extends if match in config
    if (node.token === ts.SyntaxKind.ExtendsKeyword) {
        const identifiers = getIdentifiers(node);
        // Only care about the first one
        if (identifiers.length > 0 && ~config.removeExtends.indexOf(identifiers[0].getText()))
            return {
                span: {
                    start: node.getStart(),
                    length: node.getWidth()
                },
                newText: ''
            } as ts.TextChange;
    }
    return;
}

function getMethodChanges(node: ts.MethodDeclaration, className: string, implementsNames: string[], config: TransformConfig) {
    const changes: ts.TextChange[] = [];
    // This method should be the constructor
    if (className === node.name.getText()) {
        // Remove if empty body
        if (!node.body) {
            changes.push({
                span: {
                    start: node.getStart(),
                    length: node.getWidth()
                },
                newText: ''
            });
        }
        else {
            // * Need check here for body with only comments and whitespace

            // Convert to constructor
            changes.push({
                span: {
                    start: node.name.getStart(),
                    length: node.name.getWidth()
                },
                newText: 'constructor'
            });
        }
    }
    // Convert methods to functions if class not on ignore list
    else if (className && !~config.ignoreClasses.indexOf(className)) {

        // Check for functions to ignore
        let ignoreFuncs: string[] = [];
        if (implementsNames.length > 0) {
            for (const impl of implementsNames) {
                const interfaceDef = config.ignoreInterfaceMethods[impl];
                if (interfaceDef) {
                    ignoreFuncs = ignoreFuncs.concat(interfaceDef);
                }
            }
        }

        // Convert method to function
        if (!~ignoreFuncs.indexOf(node.name.getText())) {

            const methodStart = node.getStart();
            const leadingTriviaStart = methodStart - node.getLeadingTriviaWidth();

            const sourceFileText = node.getSourceFile().getFullText();

            const methodText = node.getText();
            const leadingTrivia = sourceFileText.slice(leadingTriviaStart, methodStart);
            console.log('lead ', leadingTrivia);
            let newText = methodText;
            let newPreText = '';
            if (node.modifiers) {
                for (const modifier of node.modifiers) {
                    if (modifier.kind === ts.SyntaxKind.PublicKeyword) {
                        newPreText += 'export';
                    }
                    newText = newText.slice(0, modifier.getStart() - methodStart) +
                        newText.slice(modifier.getEnd() - methodStart, newText.length);
                }
            }
            newText = leadingTrivia + newPreText + ' function ' + newText;

            // Remove method
            changes.push({
                span: {
                    start: node.getFullStart(),
                    length: node.getFullWidth()
                },
                newText: ''
            });

            // Insert function at bottom
            changes.push({
                span: {
                    start: node.getSourceFile().getEnd(),
                    length: 0
                },
                newText
            });
        }
    }
    return changes;
}
