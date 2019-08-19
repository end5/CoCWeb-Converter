import { TokenType } from "./Token";
import { Scanner } from "./Scanner";
import { TokenChanger } from "./TextChanger";

/**
 * Converts the text from AS3 to TS.
 * Removes 'package' and 'import'.
 * Converts types.
 * If file is loaded by "includes", convert all methods to functions.
 * @param text
 * @param isIncluded Was this file loaded by "includes"
 */
export function convert(text: string, source: string, isIncluded: boolean) {
    const scanner = new Scanner(text, source);
    const changer = new TokenChanger(text);

    while (!scanner.eos()) {
        switch (scanner.peek().type) {
            case TokenType.PACKAGE:
                changer.add(scanner.consume());
                if (scanner.match(TokenType.IDENTIFIER)) {
                    changer.add(scanner.consume());
                }
                removeMatchingBraces(scanner, changer);
                break;

            case TokenType.IMPORT:
                changer.add(scanner.consume(), '// import');
                // while (
                //     scanner.peek().type === TokenType.IDENTIFIER ||
                //     scanner.peek().type === TokenType.DOT ||
                //     scanner.peek().type === TokenType.MULT
                // ) {
                //     changer.replace('');
                //     scanner.consume();
                // }
                break;

            case TokenType.INCLUDE:
                changer.add(scanner.consume(), '// include');
                break;

            case TokenType.FOR:
                scanner.consume();
                let isForEach = false;
                if (scanner.match(TokenType.IDENTIFIER, 'each')) {
                    changer.add(scanner.consume(), '');
                    isForEach = true;
                }

                scanner.consume(TokenType.LEFTPAREN);

                if (scanner.match(TokenType.VAR))
                    changer.add(scanner.consume(), 'const');

                scanner.consume(TokenType.IDENTIFIER);

                if (scanner.match(TokenType.COLON))
                    changer.add(scanner.consume(), '');

                if (scanner.match(TokenType.IDENTIFIER))
                    changer.add(scanner.consume(), '');

                if (isForEach) {
                    if (scanner.match(TokenType.IN))
                        changer.add(scanner.consume(), 'of');
                }

                break;

            case TokenType.PUBLIC:
            case TokenType.PROTECTED:
            case TokenType.PRIVATE:
                handleDeclaration(scanner, changer, isIncluded);
                break;

            case TokenType.IDENTIFIER:
                switch (scanner.peek().text) {
                    case 'Vector':
                        scanner.consume();
                        if (scanner.match(TokenType.DOT)) {
                            changer.add(scanner.consume());
                        }
                        break;
                    case 'override':
                    case 'internal':
                        handleDeclaration(scanner, changer, isIncluded);
                        break;
                    default:
                        scanner.consume();
                }
                break;

            case TokenType.COLON:
                scanner.consume();
                if (scanner.match(TokenType.MULT)) {
                    changer.add(scanner.consume(), 'any');
                }
                else if (scanner.match(TokenType.IDENTIFIER))
                    switch (scanner.peek().text) {
                        case 'Function':
                            changer.add(scanner.consume(), '() => void');
                            break;
                        case 'Boolean':
                            changer.add(scanner.consume(), 'boolean');
                            break;
                        case 'Number':
                        case 'int':
                            changer.add(scanner.consume(), 'number');
                            break;
                        case 'String':
                            changer.add(scanner.consume(), 'string');
                            break;
                        case 'Array':
                            changer.add(scanner.consume(), 'any[]');
                            break;
                        case 'Object':
                            changer.add(scanner.consume(), 'Record<string, any>');
                            break;
                        default:
                            scanner.consume();
                    }
                break;

            case TokenType.IS:
                changer.add(scanner.consume(), 'instanceof');
                break;

            default:
                scanner.consume();
        }
    }

    return changer.getChanges();
}

function handleDeclaration(scanner: Scanner, changer: TokenChanger, isIncluded?: boolean) {
    // Remove override
    if (scanner.match(TokenType.IDENTIFIER, 'override')) {
        changer.add(scanner.consume());
    }

    const accessModifier = scanner.consume(TokenType.PUBLIC) ||
        scanner.consume(TokenType.PROTECTED) ||
        scanner.consume(TokenType.PRIVATE) ||
        scanner.consume(TokenType.IDENTIFIER, 'internal');

    const staticModifier = scanner.consume(TokenType.IDENTIFIER, 'static');

    // Remove override
    if (scanner.match(TokenType.IDENTIFIER, 'override')) {
        changer.add(scanner.consume());
    }

    const declareType = scanner.consume(TokenType.FUNCTION) ||
        scanner.consume(TokenType.VAR) ||
        scanner.consume(TokenType.CLASS) ||
        scanner.consume(TokenType.CONST);

    if (declareType) {
        if (declareType.type === TokenType.CLASS && accessModifier) {
            if (accessModifier.type === TokenType.PUBLIC || accessModifier.text === 'internal') {
                changer.add(accessModifier, 'export');
            }
            else {
                changer.add(accessModifier);
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
                    if (accessModifier.type === TokenType.PUBLIC || accessModifier.text === 'internal') {
                        changer.add(accessModifier, 'export');
                    }
                    else {
                        changer.add(accessModifier);
                    }
                }
                if (staticModifier)
                    changer.add(staticModifier);
            }
            else {
                // internal -> public
                // public | protected | private -> public | protected | private
                // static -> static
                // function | var | const -> ''
                if (accessModifier) {
                    if (accessModifier.text === 'internal') {
                        changer.add(accessModifier, 'public');
                    }

                    changer.add(declareType);
                }
            }
        }
    }
}

function removeMatchingBraces(scanner: Scanner, changer: TokenChanger) {
    const startPos = scanner.pos;
    const start = scanner.peek();

    // Find first open brace index
    scanner.eatWhileNot(TokenType.LEFTBRACE);
    const leftBraceToken = scanner.consume();

    // Find matching close brace index
    let braceCounter = 1;
    let rightBraceToken;
    // console.log('brace ' + braceCounter);
    while (!scanner.eos()) {
        if (scanner.consume(TokenType.LEFTBRACE)) {
            braceCounter++;
            // console.log('brace++ ' + braceCounter);
        }
        else if (scanner.consume(TokenType.RIGHTBRACE)) {
            braceCounter--;
            // console.log('brace-- ' + braceCounter);
        }

        if (braceCounter === 0) {
            rightBraceToken = scanner.peek();
            scanner.pos = startPos;
            break;
        }
        scanner.eatWhileNot(TokenType.LEFTBRACE, TokenType.RIGHTBRACE);
    }

    if (!rightBraceToken)
        throw new Error(`Could not find matching closing brace starting from [${start.start}] "${start.text}". Mismatch count ${braceCounter}`);

    // Remove braces
    changer.add(leftBraceToken);
    changer.add(rightBraceToken);
}
