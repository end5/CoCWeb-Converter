import * as ts from "typescript";
import { TokenType, Token } from "./Token";
import { Scanner } from "./Scanner";
import { applyTextChanges } from "./TextChanges";

function replaceToken(token: Token, text?: string): ts.TextChange {
    return {
        span: {
            start: token.start,
            length: token.length
        },
        newText: text || ''
    };
}

/**
 * Converts the text from AS3 to TS.
 * Removes 'package' and 'import'.
 * Converts types.
 * If file is loaded by "includes", convert all methods to functions.
 * @param text
 * @param isIncluded Was this file loaded by "includes"
 */
export function convert(source: string, isIncluded: boolean) {
    const scanner = new Scanner(source);
    const changes: ts.TextChange[] = [];

    while (!scanner.eos()) {
        switch (scanner.peek().type) {
            case TokenType.PACKAGE:
                changes.push(replaceToken(scanner.consume(), '// package'));
                // Unsure if want to parse info
                // changes.push(replaceToken(scanner.consume()));
                // while (!scanner.eos()) {
                //     if (scanner.match(TokenType.IDENTIFIER)) {
                //         changes.push(replaceToken(scanner.consume()));
                //         if (scanner.match(TokenType.DOT)) {
                //             changes.push(replaceToken(scanner.consume()));
                //             continue;
                //         }
                //     }
                //     break;
                // }

                removeMatchingBraces(scanner, changes);
                break;

            case TokenType.IMPORT:
                changes.push(replaceToken(scanner.consume(), '// import'));
                // Unsure if want to parse info
                // changes.push(replaceToken(scanner.consume()));
                // while (!scanner.eos()) {
                //     if (scanner.match(TokenType.IDENTIFIER) || scanner.match(TokenType.MULT)) {
                //         changes.push(replaceToken(scanner.consume()));
                //         if (scanner.match(TokenType.DOT)) {
                //             changes.push(replaceToken(scanner.consume()));
                //             continue;
                //         }
                //         else if (scanner.match(TokenType.SEMICOLON)) {
                //             changes.push(replaceToken(scanner.consume()));
                //             break;
                //         }
                //     }
                //     break;
                // }
                break;

            case TokenType.INCLUDE:
                changes.push(replaceToken(scanner.consume(), '// include'));
                break;

            case TokenType.FOR:
                scanner.consume();
                let isForEach = false;
                if (scanner.match(TokenType.IDENTIFIER, 'each')) {
                    changes.push(replaceToken(scanner.consume(), ''));
                    isForEach = true;
                }

                scanner.consume(TokenType.LEFTPAREN);

                if (scanner.match(TokenType.VAR))
                    changes.push(replaceToken(scanner.consume(), 'const'));

                scanner.consume(TokenType.IDENTIFIER);

                if (scanner.match(TokenType.COLON))
                    changes.push(replaceToken(scanner.consume(), ''));

                if (scanner.match(TokenType.IDENTIFIER))
                    changes.push(replaceToken(scanner.consume(), ''));

                if (isForEach) {
                    if (scanner.match(TokenType.IN))
                        changes.push(replaceToken(scanner.consume(), 'of'));
                }

                break;

            case TokenType.PUBLIC:
            case TokenType.PROTECTED:
            case TokenType.PRIVATE:
                handleDeclaration(scanner, changes, isIncluded);
                break;

            case TokenType.IDENTIFIER:
                switch (scanner.getTokenText()) {
                    case 'Vector':
                        scanner.consume();
                        if (scanner.match(TokenType.DOT)) {
                            changes.push(replaceToken(scanner.consume()));
                        }
                        break;
                    case 'override':
                    case 'internal':
                        handleDeclaration(scanner, changes, isIncluded);
                        break;
                    default:
                        scanner.consume();
                }
                break;

            case TokenType.COLON:
                scanner.consume();
                if (scanner.match(TokenType.MULT)) {
                    changes.push(replaceToken(scanner.consume(), 'any'));
                }
                else if (scanner.match(TokenType.IDENTIFIER))
                    switch (scanner.getTokenText()) {
                        case 'Function':
                            changes.push(replaceToken(scanner.consume(), '() => void'));
                            break;
                        case 'Boolean':
                            changes.push(replaceToken(scanner.consume(), 'boolean'));
                            break;
                        case 'Number':
                        case 'int':
                            changes.push(replaceToken(scanner.consume(), 'number'));
                            break;
                        case 'String':
                            changes.push(replaceToken(scanner.consume(), 'string'));
                            break;
                        case 'Array':
                            changes.push(replaceToken(scanner.consume(), 'any[]'));
                            break;
                        case 'Object':
                            changes.push(replaceToken(scanner.consume(), 'Record<string, any>'));
                            break;
                        default:
                            scanner.consume();
                    }
                break;

            case TokenType.IS:
                changes.push(replaceToken(scanner.consume(), 'instanceof'));
                break;

            default:
                scanner.consume();
        }
    }

    return applyTextChanges(scanner.text, changes);
}

function handleDeclaration(scanner: Scanner, changes: ts.TextChange[], isIncluded?: boolean) {
    // Remove override
    if (scanner.match(TokenType.IDENTIFIER, 'override')) {
        changes.push(replaceToken(scanner.consume()));
    }

    const accessModifier = scanner.consume(TokenType.PUBLIC) ||
        scanner.consume(TokenType.PROTECTED) ||
        scanner.consume(TokenType.PRIVATE) ||
        scanner.consume(TokenType.IDENTIFIER, 'internal');

    let staticModifier;
    while (scanner.match(TokenType.IDENTIFIER)) {
        staticModifier = scanner.consume(TokenType.IDENTIFIER, 'static');

        // Remove override and virtual
        if (!staticModifier)
            changes.push(replaceToken(scanner.consume()));

    }

    const declareType = scanner.consume(TokenType.FUNCTION) ||
        scanner.consume(TokenType.VAR) ||
        scanner.consume(TokenType.CLASS) ||
        scanner.consume(TokenType.CONST);

    if (declareType) {
        if (declareType.type === TokenType.CLASS && accessModifier) {
            if (accessModifier.type === TokenType.PUBLIC || scanner.getTokenText(accessModifier) === 'internal') {
                changes.push(replaceToken(accessModifier, 'export'));
            }
            else {
                changes.push(replaceToken(accessModifier));
            }
        }
        else if (
            declareType.type === TokenType.FUNCTION ||
            declareType.type === TokenType.VAR ||
            declareType.type === TokenType.CONST
        ) {
            if (isIncluded) {
                // public | internal -> export
                // protected | private -> ''
                // static -> ''
                // function | var | const -> function | var | const
                if (accessModifier) {
                    if (accessModifier.type === TokenType.PUBLIC || scanner.getTokenText(accessModifier) === 'internal') {
                        changes.push(replaceToken(accessModifier, 'export'));
                    }
                    else {
                        changes.push(replaceToken(accessModifier));
                    }
                }
                if (staticModifier)
                    changes.push(replaceToken(staticModifier));
            }
            else {
                // internal -> public
                // public | protected | private -> public | protected | private
                // static -> static
                // function | var | const -> ''
                if (accessModifier) {
                    if (scanner.getTokenText(accessModifier) === 'internal') {
                        changes.push(replaceToken(accessModifier, 'public'));
                    }

                    changes.push(replaceToken(declareType));
                }
            }
        }
    }
}

function removeMatchingBraces(scanner: Scanner, changes: ts.TextChange[]) {
    const startPos = scanner.pos;
    const startToken = scanner.peek();

    // Find first open brace index
    scanner.eatWhileNot(TokenType.LEFTBRACE);
    const leftBraceToken = scanner.consume();

    // Find matching close brace index
    let braceCounter = 1;
    let rightBraceToken;
    // console.log('brace ' + braceCounter);
    while (!scanner.eos()) {
        if (scanner.match(TokenType.LEFTBRACE)) {
            braceCounter++;
            // console.log('brace++ ' + braceCounter);
            scanner.consume();
        }
        else if (scanner.match(TokenType.RIGHTBRACE)) {
            braceCounter--;
            // console.log('brace-- ' + braceCounter);
            rightBraceToken = scanner.consume();
        }

        if (braceCounter === 0)
            break;

        scanner.eatWhileNot(TokenType.LEFTBRACE, TokenType.RIGHTBRACE);
    }

    if (!rightBraceToken)
        throw new Error(`Could not find matching closing brace starting from [${startToken.start}] "${scanner.getTokenText(startToken)}". Mismatch count ${braceCounter}`);

    scanner.pos = startPos;

    // Remove braces
    changes.push(replaceToken(leftBraceToken));
    changes.push(replaceToken(rightBraceToken));
}
