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
 * Removes 'package', 'import' and 'use'.
 * Converts types.
 * Anything found outside a class is converted to standalone
 * @param text
 */
export function convert(source: string) {
    const scanner = new Scanner(source);
    const changes: ts.TextChange[] = [];

    let foundPackage = false;
    let insidePackage = 0;
    let foundClass = false;
    let insideClass = 0;
    let braceCounter = 0;

    while (!scanner.eos()) {
        switch (scanner.peek().type) {
            case TokenType.LEFTBRACE:
                braceCounter++;
                if (foundPackage) {
                    foundPackage = false;
                    insidePackage = braceCounter;
                    changes.push(replaceToken(scanner.consume()));
                    break;
                }

                scanner.consume();
                if (foundClass) {
                    foundClass = false;
                    insideClass = braceCounter;
                }

                break;

            case TokenType.RIGHTBRACE:
                if (braceCounter === insidePackage) {
                    insidePackage = -1;
                    changes.push(replaceToken(scanner.consume()));
                    break;
                }

                scanner.consume();
                if (braceCounter === insideClass)
                    insideClass = -1;
                braceCounter--;

                break;

            case TokenType.PACKAGE:
                // changes.push(replaceToken(scanner.consume(), '// package'));
                changes.push(replaceToken(scanner.consume()));

                removeIdentifierChain(scanner, changes);

                foundPackage = true;
                // removeMatchingBraces(scanner, changes);
                break;

            case TokenType.IMPORT:
                // changes.push(replaceToken(scanner.consume(), '// import'));
                changes.push(replaceToken(scanner.consume()));

                removeIdentifierChain(scanner, changes);

                break;

            case TokenType.USE:
                // changes.push(replaceToken(scanner.consume(), '// use'));
                // Simplifying this because only "use namespace kGAMECLASS" is found in CoC Vanilla code
                changes.push(replaceToken(scanner.consume())); // use
                changes.push(replaceToken(scanner.consume())); // namespace
                changes.push(replaceToken(scanner.consume())); // kGAMECLASS

                break;

            case TokenType.CLASS:
                foundClass = true;
                scanner.consume();
                break;

            case TokenType.XMLMARKUP:
                const token = scanner.consume();
                changes.push(replaceToken(token, '`' + scanner.text.substr(token.start, token.length) + '`'));
                break;

            case TokenType.INCLUDE:
                changes.push(replaceToken(scanner.consume(), '// include'));
                break;

            case TokenType.FOR:
                scanner.consume();
                let isForEach = false;
                if (scanner.match(TokenType.IDENTIFIER, 'each')) {
                    changes.push(replaceToken(scanner.consume()));
                    isForEach = true;
                }

                scanner.consume(TokenType.LEFTPAREN);

                if (scanner.match(TokenType.VAR))
                    changes.push(replaceToken(scanner.consume(), 'const'));

                scanner.consume(TokenType.IDENTIFIER);

                if (scanner.match(TokenType.COLON))
                    changes.push(replaceToken(scanner.consume()));

                if (scanner.match(TokenType.IDENTIFIER))
                    changes.push(replaceToken(scanner.consume()));

                if (isForEach) {
                    if (scanner.match(TokenType.IN))
                        changes.push(replaceToken(scanner.consume(), 'of'));
                }

                break;

            case TokenType.PUBLIC:
            case TokenType.PROTECTED:
            case TokenType.PRIVATE:
                handleDeclaration(scanner, changes, !~insideClass);
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
                        handleDeclaration(scanner, changes, !~insideClass);
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

function removeIdentifierChain(scanner: Scanner, changes: ts.TextChange[]) {
    if (scanner.match(TokenType.IDENTIFIER)) {
        changes.push(replaceToken(scanner.consume()));
        while (scanner.match(TokenType.DOT)) {
            changes.push(replaceToken(scanner.consume()));
            if (scanner.match(TokenType.IDENTIFIER)) {
                changes.push(replaceToken(scanner.consume()));
            }
            else if (scanner.match(TokenType.MULT)) {
                changes.push(replaceToken(scanner.consume()));
            }
        }
    }
    if (scanner.match(TokenType.SEMICOLON))
        changes.push(replaceToken(scanner.consume()));
}

function handleDeclaration(scanner: Scanner, changes: ts.TextChange[], insideClass?: boolean) {
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
        scanner.consume(TokenType.INTERFACE) ||
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
            if (insideClass) {
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

// function removeMatchingBraces(scanner: Scanner, changes: ts.TextChange[]) {
//     const startPos = scanner.pos;
//     const startToken = scanner.peek();

//     // Find first open brace index
//     scanner.eatWhileNot(TokenType.LEFTBRACE);
//     const leftBraceToken = scanner.consume();

//     // Find matching close brace index
//     let braceCounter = 1;
//     let rightBraceToken;
//     // console.log('brace ' + braceCounter);
//     while (!scanner.eos()) {
//         if (scanner.match(TokenType.LEFTBRACE)) {
//             braceCounter++;
//             // console.log('brace++ ' + braceCounter);
//             scanner.consume();
//         }
//         else if (scanner.match(TokenType.RIGHTBRACE)) {
//             braceCounter--;
//             // console.log('brace-- ' + braceCounter);
//             rightBraceToken = scanner.consume();
//         }

//         if (braceCounter === 0)
//             break;

//         scanner.eatWhileNot(TokenType.LEFTBRACE, TokenType.RIGHTBRACE);
//     }

//     if (!rightBraceToken)
//         throw new Error(`Could not find matching closing brace starting from [${startToken.start}] "${scanner.getTokenText(startToken)}". Mismatch count ${braceCounter}`);

//     scanner.pos = startPos;

//     // Remove braces
//     changes.push(replaceToken(leftBraceToken));
//     changes.push(replaceToken(rightBraceToken));
// }
