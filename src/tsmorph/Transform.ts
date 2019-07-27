import { SyntaxKind, MethodDeclarationStructure, TypeGuards, SourceFile, MethodDeclaration, FunctionDeclaration, Node } from "ts-morph";
import { TransformConfig, ParameterStruct } from "./Config";
import { log } from "./Log";

/**
 * Transforms code using the following steps.
 * 1. Transform class
 *   1. Find and transform method with same name as class to constructor. Remove it if empty.
 *   2. Transform methods to functions
 * 2. Remove empty classes
 * 3. Format
 * @param sourceFile
 * @param config
 */
export function transform(sourceFile: SourceFile, config: TransformConfig) {
    const classes = sourceFile.getClasses();
    for (const classDec of classes) {
        const className = classDec.getName();
        if (className) {
            log('In Class ' + classDec.getName());

            // Fix extends
            const extendsNode = classDec.getExtends();
            if (extendsNode && ~config.removeExtends.indexOf(extendsNode.getText())) {
                log('  Removing "extends ' + extendsNode.getText() + '"');
                classDec.removeExtends();
            }

            // Fix methods
            const methods = classDec.getMembersWithComments();

            for (const method of methods) {
                if (method.wasForgotten() || !TypeGuards.isMethodDeclaration(method))
                    continue;

                const methodBody = method.getBody();

                log('  In Method ' + method.getName());

                // Convert constructor
                if (method.getName() === className) {
                    // Looking for no body or body full of whitespace
                    if (!methodBody || (methodBody && hasEmptyBody(methodBody))) {
                        log('    Empty body');
                        method.remove();
                        continue;
                    }
                    else {
                        log('    Converting to constructor');

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
                            log('    Adding "super"');
                            constr.insertStatements(0, 'super();');
                        }

                        continue;
                    }
                }

                // Fix method body
                // fixBody(method, config.identiferToParamPairs);

                // Convert method to function if allowed
                if (!~config.ignoreClasses.indexOf(className)) {

                    // Check for functions to ignore
                    let ignoreFuncs: string[] = [];
                    const impls = classDec.getImplements();
                    if (impls.length > 0) {
                        for (const impl of impls) {
                            const interfaceDef = config.ignoreInterfaceMethods[impl.getText()];
                            if (interfaceDef) {
                                ignoreFuncs = ignoreFuncs.concat(interfaceDef);
                            }
                        }
                    }

                    // Convert
                    if (!~ignoreFuncs.indexOf(method.getName())) {
                        const structure = method.getStructure() as MethodDeclarationStructure;
                        log('    Converting to function');
                        // log(structure.leadingTrivia);
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
                            // log('    Moving leading comment ' + prev.getText());
                            log('    Moving leading comment');
                            prev.remove();
                            prev = method.getPreviousSibling();
                        }

                        const isEnd = method.getNextSiblings().every((node) => TypeGuards.isCommentClassElement(node));
                        if (isEnd) {
                            let next = method.getNextSibling();
                            while (next && TypeGuards.isCommentClassElement(next)) {
                                // log('    Moving trailing comment ' + next.getText());
                                log('    Moving trailing comment');
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
            log('Removing class ' + index);
            classDec.remove();

            if (comments.length > 0) {
                log('Moving comments');
                sourceFile.getSourceFile().insertText(index, [comments.join('\n'), '\n'].join(''));
            }

            classList = sourceFile.getClasses();
        }
    }

    sourceFile.formatText({
        ensureNewLineAtEndOfFile: true,
    });

    return sourceFile;
}

/**
 * Check if the node has an empty body ignoring whitespace.
 * @param node
 */
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

/**
 * Compares each function call to its definition and adds any missing parameters.
 * Returns true if a change happened.
 * @param sourceFile
 * @param config
 */
export function fixMissingArgs(sourceFile: SourceFile, config: TransformConfig) {
    let changeOccured = false;
    let checkAgain = true;
    while (checkAgain) {
        log('Checking again');
        const methodsAndFunctions = [
            ...sourceFile.getFunctions(),
            ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration)
        ];
        const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
        for (const call of calls) {
            const identity = call.getFirstDescendantByKind(SyntaxKind.Identifier);
            if (identity) {
                const funcDefs = identity.getDefinitionNodes();
                for (const funcDef of funcDefs) {
                    if (TypeGuards.isFunctionDeclaration(funcDef) || TypeGuards.isMethodDeclaration(funcDef)) {
                        const args = call.getArguments();
                        const params = funcDef.getParameters().filter((param) => !param.isOptional());
                        if (args.length < params.length) {
                            call.insertArguments(0, params.map((node) => node.getName()));
                            changeOccured = true;
                        }
                    }
                }
            }
        }

        checkAgain = false;
        for (const method of methodsAndFunctions) {
            checkAgain = checkAgain || fixBody(method, config.identiferToParamPairs);
        }
    }
    return changeOccured;
}

/**
 * Checks for identifiers in the body that are in params and adds it as a parameter to the method.
 * Returns true if a change occured.
 * @param method
 * @param params
 */
function fixBody(method: MethodDeclaration | FunctionDeclaration, params: ParameterStruct[]) {
    let changed = false;
    const methodBody = method.getBody();
    if (methodBody) {
        const identifiers = methodBody.getDescendantsOfKind(SyntaxKind.Identifier);

        for (const paramStruct of params) {
            // Fix monster parameter requirement
            const match = identifiers.find((node) => node.getText() === paramStruct.name);
            if (match && !method.getParameters().find((param) => param.getName() === paramStruct.name)) {
                changed = true;
                log('    Found ' + paramStruct.name);
                method.insertParameter(0, paramStruct);
            }
        }
    }
    return changed;
}
