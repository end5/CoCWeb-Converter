import { SyntaxKind, MethodDeclarationStructure, TypeGuards, SourceFile } from "ts-morph";

const removeExtends = ["BaseContent", "Utils", "NPCAwareContent", "AbstractLakeContent", "BazaarAbstractContent", "AbstractBoatContent", "AbstractFarmContent", "TelAdreAbstractContent"];

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

                let methodBody = method.getBody();

                console.log('  In Method ' + method.getName());

                // Convert constructor
                if (method.getName() === className) {
                    if (!methodBody || (methodBody && methodBody.getChildCount() === 0)) {
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
                methodBody = method.getBody();
                if (methodBody) {
                    const identifiers = methodBody.getDescendantsOfKind(SyntaxKind.Identifier);

                    // Fix player parameter requirement
                    let match = identifiers.find((node) => node.getText() === 'player');
                    if (match) {
                        console.log('    Found player');
                        method.insertParameter(0, {
                            name: 'player',
                            type: 'Player'
                        });
                    }
                    // Fix monster parameter requirement
                    match = identifiers.find((node) => node.getText() === 'monster');
                    if (match) {
                        console.log('    Found monster');
                        method.insertParameter(0, {
                            name: 'monster',
                            type: 'Monster'
                        });
                    }

                }

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
                    sourceFile.addFunction({
                        leadingTrivia: method.getLeadingCommentRanges().map((comment) => comment.getText()),
                        docs: structure.docs,
                        isExported: !structure.scope || (structure.scope && structure.scope === 'public'),
                        name: structure.name,
                        parameters: structure.parameters,
                        typeParameters: structure.typeParameters,
                        statements: structure.statements,
                        returnType: structure.returnType,
                        trailingTrivia: method.getTrailingCommentRanges().map((comment) => comment.getText()),
                    });

                    // let leadingComment;
                    // let trailingComment;

                    // if (index > 0 && TypeGuards.isCommentClassElement(methods[index - 1])) {
                    //     leadingComment = methods[index - 1];
                    // }

                    // if (index < methods.length - 1 && TypeGuards.isCommentClassElement(methods[index + 1])) {
                    //     trailingComment = methods[index + 1];
                    // }

                    // if (leadingComment) {
                    //     console.log('    Leading comment removed');
                    //     leadingComment.remove();
                    // }

                    let prev = method.getPreviousSibling();
                    while (prev && TypeGuards.isCommentClassElement(prev)) {
                        console.log('    Prev comment found ' + prev.getText());
                        prev.remove();
                        prev = method.getPreviousSibling();
                    }

                    const isEnd = method.getNextSiblings().every((node) => TypeGuards.isCommentClassElement(node));
                    if (isEnd) {
                        let next = method.getNextSibling();
                        while (next && TypeGuards.isCommentClassElement(next)) {
                            console.log('    Next comment found ' + next.getText());
                            sourceFile.addStatements(next.getText());
                            next.remove();
                            next = method.getNextSibling();
                        }
                    }
                    // const next = method.getNextSibling();
                    // if (next && TypeGuards.isCommentClassElement(next)) {
                    //     console.log('Next comment found ' + next.getText());
                    // }

                    method.remove();

                    // if (trailingComment) {
                    //     console.log('    Trailing comment removed');
                    //     trailingComment.remove();
                    // }

                }
            }
        }
    }

    sourceFile.formatText({
        ensureNewLineAtEndOfFile: true,
    });

    return sourceFile;
}
