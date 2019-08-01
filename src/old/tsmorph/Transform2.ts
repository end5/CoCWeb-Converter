import { SyntaxKind, TypeGuards, SourceFile, MethodDeclaration, FunctionDeclaration, Node } from "ts-morph";
import { TransformConfig, ParameterStruct } from "../../Config";
import { log } from "../../Log";

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

            // Check for "super" if class extends anything
            const constrs = classDec.getConstructors();
            for (const constr of constrs) {
                const constrBody = constr.getBody();
                if (extendsNode && constrBody && constrBody.getChildrenOfKind(SyntaxKind.SuperKeyword).length === 0) {
                    log('    Adding "super"');
                    constr.insertStatements(0, 'super();');
                }
            }

            // Fix methods
            for (const method of classDec.getMethods()) {

                log('  In Method ' + method.getName());

                // Convert constructor
                if (method.getName() === className) {
                    // Looking for no body or body full of whitespace
                    const methodBody = method.getBody();
                    if (!methodBody || (methodBody && hasEmptyBody(methodBody))) {
                        log('    Empty body');

                        const methodStart = method.getStart();
                        const methodEnd = method.getEnd();
                        const leadingTriviaStart = methodStart - method.getLeadingTriviaWidth();
                        const trailingTriviaEnd = methodEnd + method.getTrailingTriviaWidth();

                        const sourceFileText = sourceFile.getFullText();

                        const leadingTrivia = sourceFileText.slice(leadingTriviaStart, methodStart);
                        const trailingTrivia = sourceFileText.slice(methodEnd, trailingTriviaEnd);

                        method.replaceWithText('');

                        sourceFile.insertText(classDec.getStart(), leadingTrivia + trailingTrivia);

                        // return {
                        //     state: 'restart',
                        //     sourceFile: sourceFile.replaceText(
                        //         [method.getStart() - method.getLeadingTriviaWidth(),
                        //         method.getEnd() + method.getTrailingTriviaWidth()],
                        //         ''
                        //     )
                        // };
                        return { state: 'restart', sourceFile };
                    }
                    else {
                        log('    Converting to constructor');
                        method.rename('constructor');

                        // Breaking change
                        return { state: 'restart', sourceFile };
                    }
                }
                else {
                    // Convert methods to functions if class not on ignore list
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

                        // Convert method to function
                        if (!~ignoreFuncs.indexOf(method.getName())) {
                            log('    Converting to function');

                            const methodStart = method.getStart();
                            const methodEnd = method.getEnd();
                            const leadingTriviaStart = methodStart - method.getLeadingTriviaWidth();
                            const trailingTriviaEnd = methodEnd + method.getTrailingTriviaWidth();

                            const sourceFileText = sourceFile.getFullText();

                            let methodText = method.getText();
                            const leadingTrivia = sourceFileText.slice(leadingTriviaStart, methodStart);
                            const trailingTrivia = sourceFileText.slice(methodEnd, trailingTriviaEnd);

                            if (methodText.startsWith('public')) {
                                methodText = 'export function' + methodText.slice('public'.length);
                            }
                            else if (methodText.startsWith('protected')) {
                                methodText = 'function' + methodText.slice('protected'.length);
                            }
                            else if (methodText.startsWith('private')) {
                                methodText = 'function' + methodText.slice('private'.length);
                            }

                            sourceFile = sourceFile.replaceText([leadingTriviaStart, trailingTriviaEnd], '');
                            sourceFile = sourceFile.insertText(sourceFile.getEnd(), leadingTrivia + methodText + trailingTrivia);

                            // Breaking change
                            return { state: 'restart', sourceFile };
                        }
                    }
                }
            }
        }
    }

    const classDecList = sourceFile.getClasses();
    for (const classDec of classDecList) {
        let bodyText = '';

        const classStart = classDec.getStart();
        const classEnd = classDec.getEnd();
        const leadingTriviaStart = classStart - classDec.getLeadingTriviaWidth();
        const trailingTriviaEnd = classEnd + classDec.getTrailingTriviaWidth();

        const sourceFileText = sourceFile.getFullText();

        const leadingTrivia = sourceFileText.slice(leadingTriviaStart, classStart);
        const trailingTrivia = sourceFileText.slice(classEnd, trailingTriviaEnd);

        // Check for comments only
        if (!hasEmptyBody(classDec)) {
            const children = classDec.getChildren();
            let index = 0;
            while (children[index].getKind() !== SyntaxKind.OpenBraceToken)
                index++;

            index++;
            const syntaxList = children[index];
            if (TypeGuards.isSyntaxList(syntaxList)) {
                const maybeComments = syntaxList.getChildren();
                if (maybeComments.every((child) => child.getKind() === SyntaxKind.SingleLineCommentTrivia || child.getKind() === SyntaxKind.MultiLineCommentTrivia)) {
                    bodyText = sourceFileText.slice(syntaxList.getStart(), syntaxList.getEnd());
                }
            }
        }

        // Either empty body or comments only in the body
        if (hasEmptyBody(classDec) || bodyText) {
            log('Removing class');

            // Get leading trivia of closing brace
            let leadingTriviaCloseBrace = '';
            const closeBraceToken = classDec.getChildrenOfKind(SyntaxKind.CloseBraceToken)[0];
            if (closeBraceToken) {
                leadingTriviaCloseBrace = sourceFileText.slice(classEnd - closeBraceToken.getLeadingTriviaWidth(), classEnd);
            }

            // console.log(leadingTriviaStart, trailingTriviaEnd, sourceFile.getStart(), sourceFile.getEnd());
            // console.log(leadingTriviaCloseBrace);

            classDec.replaceWithText(leadingTrivia);
            // sourceFile = sourceFile.text([leadingTriviaStart, trailingTriviaEnd], '');
            // sourceFile = sourceFile.insertText(classStart, leadingTrivia);
            sourceFile = sourceFile.insertText(sourceFile.getEnd(), leadingTriviaCloseBrace + bodyText + trailingTrivia);

            // Breaking change
            return { state: 'restart', sourceFile };
        }
    }

    sourceFile.formatText({
        ensureNewLineAtEndOfFile: true,
    });

    return { state: 'finished', sourceFile };
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
