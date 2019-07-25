import { SyntaxKind, MethodDeclarationStructure, TypeGuards, SourceFile, MethodDeclaration, FunctionDeclaration, Node } from "ts-morph";

const removeExtends = ["BaseContent", "Utils", "NPCAwareContent", "AbstractLakeContent", "BazaarAbstractContent", "AbstractBoatContent", "AbstractFarmContent", "TelAdreAbstractContent"];

// const emptyBlockRegexp = /^{\s*}$/;
// function isEmptyBlock(text: string) {
//     return emptyBlockRegexp.test(text);
// }

function hasEmptyBody(node: Node) {
    // Looking for token pattern
    // OpenBrace - no children
    // SyntaxList - no children
    // CloseBrace - no children

    const children = node.getChildren();
    let index = 0;
    while (children[index].getKind() !== SyntaxKind.OpenBraceToken)
        index++;

    if (index + 2 >= node.getChildCount())
        return false;

    return children[index].getKind() === SyntaxKind.OpenBraceToken && children[index].getChildCount() === 0 &&
        children[index + 1].getKind() === SyntaxKind.SyntaxList && children[index + 1].getChildCount() === 0 &&
        children[index + 2].getKind() === SyntaxKind.CloseBraceToken && children[index + 2].getChildCount() === 0;
}

// const sourceFiles = project.getSourceFiles();
export function transform(sourceFile: SourceFile) {
    const classes = sourceFile.getClasses();
    for (const classDec of classes) {
        const className = classDec.getName();
        if (className) {
            console.log('In Class ' + classDec.getName());

            // Fix extends
            const extendsNode = classDec.getExtends();
            if (extendsNode && ~removeExtends.indexOf(extendsNode.getText())) {
                console.log('  Removing "extends ' + extendsNode.getText() + '"');
                classDec.removeExtends();
            }

            // Fix methods
            const methods = classDec.getMembersWithComments();
            // const methods = classDec.getMethods();
            for (let index = 0; index < methods.length; index++) {
                const method = methods[index];

                if (method.wasForgotten() || !TypeGuards.isMethodDeclaration(method))
                    continue;

                const methodBody = method.getBody();

                console.log('  In Method ' + method.getName());

                // Convert constructor
                if (method.getName() === className) {
                    // Looking for no body or body full of whitespace
                    if (!methodBody || (methodBody && hasEmptyBody(methodBody))) {
                        console.log('    Empty body');
                        method.remove();
                        continue;
                    }
                    else {
                        console.log('    Converting to constructor');

                        // Switch method to constructor
                        const structure = method.getStructure();
                        const constr = classDec.insertConstructor(method.getChildIndex(), {
                            docs: structure.docs,
                            leadingTrivia: structure.leadingTrivia,
                            parameters: structure.parameters,
                            scope: structure.scope,
                            statements: method.getBodyText() || '',
                            trailingTrivia: structure.trailingTrivia,
                            typeParameters: structure.typeParameters
                        });

                        method.remove();

                        // Check for "super" if class extends anything
                        const constrBody = constr.getBody();
                        if (extendsNode && constrBody && constrBody.getChildrenOfKind(SyntaxKind.SuperKeyword).length === 0) {
                            console.log('    Adding "super"');
                            constr.insertStatements(0, 'super();');
                        }

                        continue;
                    }
                }

                // Fix method body
                fixBody(method);

                // Convert method to function

                // Check for functions to ignore
                const impls = classDec.getImplements();
                const ignoreFuncs = [];
                if (impls.length > 0 && impls.find((node) => node.getText() === 'TimeAwareInterface')) {
                    ignoreFuncs.push('timeChange');
                    ignoreFuncs.push('timeChangeLarge');
                }

                // Convert
                if (!~ignoreFuncs.indexOf(method.getName())) {
                    const structure = method.getStructure() as MethodDeclarationStructure;
                    console.log('    Converting to function');
                    // console.log(structure.leadingTrivia);
                    const func = sourceFile.addFunction({
                        leadingTrivia: method.getLeadingCommentRanges().map((comment) => comment.getText() + (comment.getKind() === SyntaxKind.MultiLineCommentTrivia ? '\n' : '')),
                        docs: structure.docs,
                        isExported: !structure.scope || (structure.scope && structure.scope === 'public'),
                        name: structure.name,
                        parameters: structure.parameters,
                        typeParameters: structure.typeParameters,
                        returnType: structure.returnType,
                        trailingTrivia: method.getTrailingCommentRanges().map((comment) => comment.getText() + (comment.getKind() === SyntaxKind.MultiLineCommentTrivia ? '\n' : '')),
                    });

                    func.setBodyText(method.getBodyText() || '');

                    let prev = method.getPreviousSibling();
                    while (prev && TypeGuards.isCommentClassElement(prev)) {
                        // console.log('    Moving leading comment ' + prev.getText());
                        console.log('    Moving leading comment');
                        prev.remove();
                        prev = method.getPreviousSibling();
                    }

                    const isEnd = method.getNextSiblings().every((node) => TypeGuards.isCommentClassElement(node));
                    if (isEnd) {
                        let next = method.getNextSibling();
                        while (next && TypeGuards.isCommentClassElement(next)) {
                            // console.log('    Moving trailing comment ' + next.getText());
                            console.log('    Moving trailing comment');
                            sourceFile.addStatements(next.getText());
                            next.remove();
                            next = method.getNextSibling();
                        }
                    }

                    method.remove();
                }
            }
        }
    }

    let classList = sourceFile.getClasses();
    while (classList.length > 0) {
        const classDec = classList.shift()!;
        if (hasEmptyBody(classDec)) {
            const leadingComments = classDec.getLeadingCommentRanges();
            const trailingComments = classDec.getTrailingCommentRanges();
            const comments = [
                ...leadingComments.map((comment) => comment.getText()),
                ...trailingComments.map((comment) => comment.getText())
            ];
            const index = classDec.getChildIndex();
            console.log('Removing class ' + index);
            classDec.remove();

            if (comments.length > 0) {
                console.log('Moving comments');
                sourceFile.getSourceFile().insertText(index, [comments.join('\n'), '\n'].join(''));
            }

            classList = sourceFile.getClasses();
        }
    }

    fixAddingParams(sourceFile);

    sourceFile.formatText({
        ensureNewLineAtEndOfFile: true,
    });

    return sourceFile;
}

function fixAddingParams(sourceFile: SourceFile) {
    let checkAgain = true;
    while (checkAgain) {
        console.log('Checking again');
        const methodsAndFunctions = [
            ...sourceFile.getFunctions(),
            ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration)
        ];
        const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
        for (const call of calls) {
            const identity = call.getFirstDescendantByKind(SyntaxKind.Identifier);
            if (identity) {
                const methodOrFunction = methodsAndFunctions.find((node) => node.getName() === identity.getText());
                if (methodOrFunction) {
                    const args = call.getArguments();
                    const params = methodOrFunction.getParameters().filter((param) => !param.isOptional());
                    if (args.length < params.length) {
                        call.insertArguments(0, params.map((node) => node.getName()));
                    }
                }
            }
        }

        checkAgain = false;
        for (const method of methodsAndFunctions) {
            checkAgain = checkAgain || fixBody(method);
        }
    }
}

/**
 * Checks for "player" or "monster" in the body and adds it as a parameter.
 * Returns true if a change occured.
 * @param method
 */
function fixBody(method: MethodDeclaration | FunctionDeclaration) {
    let changed = false;
    const methodBody = method.getBody();
    if (methodBody) {
        const identifiers = methodBody.getDescendantsOfKind(SyntaxKind.Identifier);

        // Fix monster parameter requirement
        let match = identifiers.find((node) => node.getText() === 'monster');
        if (match && !method.getParameters().find((param) => param.getName() === 'monster')) {
            changed = true;
            console.log('    Found monster');
            method.insertParameter(0, {
                name: 'monster',
                type: 'Monster'
            });
        }
        // Fix player parameter requirement
        match = identifiers.find((node) => node.getText() === 'player');
        if (match && !method.getParameters().find((param) => param.getName() === 'player')) {
            changed = true;
            console.log('    Found player');
            method.insertParameter(0, {
                name: 'player',
                type: 'Player'
            });
        }
    }
    return changed;
}
