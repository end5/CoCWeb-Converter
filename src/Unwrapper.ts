import * as ts from "typescript";
import { TransformConfig } from "./Config";
import { lex } from "./Lexer/Lexer";
import { TokenType } from "./Lexer/Token";

export function getClassChanges(node: ts.SourceFile, config: TransformConfig) {
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

/**
 * If the class extends anything specified in the config, remove it
 * @param node
 * @param config
 */
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

/**
 * Check if the method node has an empty body ignoring whitespace.
 * @param node
 */
function hasEmptyBody(node: ts.MethodDeclaration) {
    const body = node.body;
    if (!body) return false;

    // Looking for token pattern
    // OpenBrace - no children
    // SyntaxList - no children
    // CloseBrace - no children

    const children = body.getChildren();
    let index = 0;
    while (children[index].kind !== ts.SyntaxKind.OpenBraceToken)
        index++;

    if (index + 2 >= body.getChildCount())
        return false;

    return children[index].kind === ts.SyntaxKind.OpenBraceToken && children[index].getChildCount() === 0 &&
        children[index + 1].kind === ts.SyntaxKind.SyntaxList && children[index + 1].getChildCount() === 0 &&
        children[index + 2].kind === ts.SyntaxKind.CloseBraceToken && children[index + 2].getChildCount() === 0;
}

/**
 * May change the method using one of the matching patterns listed below. Checked in order.
 * - Empty method -> Replace it with comments
 * - Method name === Class name -> Rename to 'constructor'
 * - Not on ignore list -> Convert method to function
 * @param node
 * @param className
 * @param implementsNames
 * @param config
 */
function getMethodChanges(node: ts.MethodDeclaration, className: string, implementsNames: string[], config: TransformConfig): ts.TextChange[] {

    // Method has an empty body
    if (hasEmptyBody(node)) {
        const comments = lex(node.getText()).filter((token) => token.type === TokenType.Comment).join('\n');
        return [
            // Remove method and replace it with any comments found inside of it
            {
                span: {
                    start: node.getStart(),
                    length: node.getWidth()
                },
                newText: comments
            }
        ];
    }

    // Method is actually the constructor
    if (className === node.name.getText()) {
        return [
            // Convert to constructor
            {
                span: {
                    start: node.name.getStart(),
                    length: node.name.getWidth()
                },
                newText: 'constructor'
            }
        ];
    }

    // Convert methods to functions if not on an ignore list
    if (className && !~config.ignoreClasses.indexOf(className)) {

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
            // console.log('lead ', leadingTrivia);
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

            return [
                // Remove method
                {
                    span: {
                        start: node.getFullStart(),
                        length: node.getFullWidth()
                    },
                    newText: ''
                },
                // Insert function at bottom
                {
                    span: {
                        start: node.getSourceFile().getEnd(),
                        length: 0
                    },
                    newText
                }
            ];
        }
    }

    // No changes
    return [];
}
