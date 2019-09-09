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

interface State {
    foundPackage: boolean;
    insidePackage: number;
    foundClass: boolean;
    insideClass: number;
    braceCounter: number;
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
    const state: State = {
        foundPackage: false,
        insidePackage: -1,
        foundClass: false,
        insideClass: -1,
        braceCounter: 0
    };

    while (!scanner.eos()) {
        switch (scanner.peek().type) {
            case TokenType.LEFTBRACE:
                state.braceCounter++;
                if (state.foundPackage) {
                    state.foundPackage = false;
                    state.insidePackage = state.braceCounter;
                    changes.push(replaceToken(scanner.consume()));
                    break;
                }

                scanner.consume();
                if (state.foundClass) {
                    state.foundClass = false;
                    state.insideClass = state.braceCounter;
                }

                break;

            case TokenType.RIGHTBRACE:
                if (state.braceCounter === state.insidePackage) {
                    state.insidePackage = -1;
                    changes.push(replaceToken(scanner.consume()));
                    break;
                }

                scanner.consume();
                if (state.braceCounter === state.insideClass)
                    state.insideClass = -1;
                state.braceCounter--;

                break;

            case TokenType.PACKAGE:
                // changes.push(replaceToken(scanner.consume(), '// package'));
                changes.push(replaceToken(scanner.consume()));

                removeIdentifierChain(scanner, changes);

                state.foundPackage = true;
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
                state.foundClass = true;
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
                handleDeclaration(scanner, changes, state);
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
                        handleDeclaration(scanner, changes, state);
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

function handleDeclaration(scanner: Scanner, changes: ts.TextChange[], state: State) {
    // Remove override
    if (scanner.match(TokenType.IDENTIFIER, 'override')) {
        changes.push(replaceToken(scanner.consume()));
    }

    const accessModifier = scanner.consume(TokenType.PUBLIC) ||
        scanner.consume(TokenType.PROTECTED) ||
        scanner.consume(TokenType.PRIVATE) ||
        scanner.consume(TokenType.IDENTIFIER, 'internal');

    const modifiers = [];
    while (scanner.match(TokenType.IDENTIFIER))
        modifiers.push(scanner.consume());

    const declareType = scanner.consume(TokenType.FUNCTION) ||
        scanner.consume(TokenType.VAR) ||
        scanner.consume(TokenType.CLASS) ||
        scanner.consume(TokenType.INTERFACE) ||
        scanner.consume(TokenType.CONST);

    if (declareType) {
        if (declareType.type === TokenType.CLASS) {
            state.foundClass = true;
            // public | internal -> export
            // protected | private -> ''
            // static -> static
            // override | virtual | final -> ''
            // class -> class
            if (accessModifier) {
                if (accessModifier.type === TokenType.PUBLIC || scanner.getTokenText(accessModifier) === 'internal') {
                    changes.push(replaceToken(accessModifier, 'export'));
                }
                else {
                    changes.push(replaceToken(accessModifier));
                }
            }

            for (const modifier of modifiers)
                if (scanner.getTokenText(modifier) !== 'static')
                    changes.push(replaceToken(modifier));
        }
        else if (
            declareType.type === TokenType.FUNCTION ||
            declareType.type === TokenType.VAR ||
            declareType.type === TokenType.CONST
        ) {
            if (!~state.insideClass) {
                // public | internal -> export
                // protected | private -> ''
                // static | override | virtual | final -> ''
                // function | var | const -> function | var | const
                if (accessModifier) {
                    if (accessModifier.type === TokenType.PUBLIC || scanner.getTokenText(accessModifier) === 'internal') {
                        changes.push(replaceToken(accessModifier, 'export'));
                    }
                    else {
                        changes.push(replaceToken(accessModifier));
                    }
                }

                for (const modifier of modifiers)
                    changes.push(replaceToken(modifier));
            }
            else {
                // internal -> public
                // public | protected | private -> public | protected | private
                // static -> static
                // override | virtual | final -> ''
                // function | var | const -> ''
                if (accessModifier) {
                    if (scanner.getTokenText(accessModifier) === 'internal') {
                        changes.push(replaceToken(accessModifier, 'public'));
                    }

                    for (const modifier of modifiers)
                        if (scanner.getTokenText(modifier) !== 'static')
                            changes.push(replaceToken(modifier));

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
