import * as ts from "typescript";
import { lex } from "./Lexer/Lexer";
import { TokenType, Token } from "./Lexer/Token";

// type ReplaceFunc = (match: string, ...args: string[]) => string;

// function check(searchValue: string | RegExp, strOrFunc: string | ReplaceFunc) {
//     return (match: string, ...args: string[]) => {
//         if (match.split('\n').length > 1)
//             console.error('Warning: Large match\nSearch Value: ' + searchValue + '\n' + match);

//         if (typeof strOrFunc === 'string')
//             return strOrFunc;
//         else if (typeof strOrFunc === 'function')
//             return strOrFunc(match, ...args);
//         return '';
//     };
// }

// function replace(text: string, searchValue: string | RegExp, replaceValue: string | ReplaceFunc): string {
//     return text.replace(searchValue, check(searchValue, replaceValue));
// }

const forEachRegex = /^\s*for each\s*\(\s*(var )?([\w\d]+)\s*(?::\s*[\w\d*]+)? in/;
const declareRegex = /^\s*(?:override\s+)?(public|protected|private|internal)\s+(static\s+)?(?:override\s+)?(function|var|class|const)/;

const replacePairs: [RegExp, string][] = [
    [/:\s*Function/g, ': () => void'],
    [/:\s*Boolean/g, ': boolean'],
    [/:\s*Number/g, ': number'],
    [/:\s*int/g, ': number'],
    [/:\s*String/g, ': string'],
    [/:\s*void/g, ': void'],
    [/:\s*Array/g, ': any[]'],
    [/Vector.</g, 'Vector<'],
    [/ is /g, ' instanceof '],
    [/:\*/g, ': any'],  // This one is dangerous
];

function textChange(token: Token, newText: string) {
    return {
        span: {
            start: token.pos,
            length: token.text.length
        },
        newText
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
export function convert(text: string, isIncluded: boolean) {
    let changes: ts.TextChange[] = [];
    const tokens = lex(text);
    let token;
    for (let index = 0; index < tokens.length; index++) {
        token = tokens[index];
        // console.log(index, token.text);

        if (token.type === TokenType.Code) {
            if (token.text.startsWith('package')) {
                // tokens.splice(index, 1);
                // console.log('Removing ' + token.text);
                changes = changes.concat(
                    [textChange(token, '')],
                    removeMatchingBraces(tokens, index)
                );
            }
            else if (token.text.startsWith('import')) {
                // tokens.splice(index, 1);
                // console.log('Removing ' + token.text);
                changes.push(textChange(token, ''));
            }
            else {
                // Fix "for each"
                let match = token.text.match(forEachRegex);
                if (match) {
                    // token.text =
                    //     'for(' +
                    //     (match[1] ? 'const ' : '') +
                    //     match[2] +
                    //     ' of' +
                    //     token.text.slice((match.index || 0) + match[0].length);
                    changes.push(textChange(token,
                        'for(' +
                        (match[1] ? 'const ' : '') +
                        match[2] +
                        ' of' +
                        token.text.slice((match.index || 0) + match[0].length)
                    ));
                }

                match = token.text.match(declareRegex);
                if (match) {

                    // 1. public|protected|private|internal
                    const accessModifier = match[1];
                    // 2. static?
                    const staticModifier = match[2] || '';
                    // 3. function|var|class|const
                    const type = match[3];

                    // const restOfLine = token.text.slice((match.index || 0) + match[0].length);

                    if (type === 'class') {
                        if (accessModifier === 'public' || accessModifier === 'internal')
                            // token.text = 'export ' + staticModifier + type + restOfLine;
                            changes.push({
                                newText: 'export ' + staticModifier + type,
                                span: {
                                    start: token.pos,
                                    length: match[0].length
                                }
                            });
                        else
                            // token.text = staticModifier + type + restOfLine;
                            changes.push({
                                newText: staticModifier + type,
                                span: {
                                    start: token.pos,
                                    length: match[0].length
                                }
                            });
                    }
                    else if (isIncluded) {
                        if (type === 'function' || type === 'var' || type === 'const') {
                            if (accessModifier === 'internal' || accessModifier === 'public')
                                // token.text = 'export ' + type + restOfLine;
                                changes.push({
                                    newText: 'export ' + type,
                                    span: {
                                        start: token.pos,
                                        length: match[0].length
                                    }
                                });
                            else
                                // token.text = type + restOfLine;
                                changes.push({
                                    newText: type,
                                    span: {
                                        start: token.pos,
                                        length: match[0].length
                                    }
                                });
                        }
                    }
                    else {
                        if (type === 'function' || type === 'var' || type === 'const') {
                            if (accessModifier === 'internal')
                                // token.text = 'public ' + staticModifier + restOfLine;
                                changes.push({
                                    newText: 'public ' + staticModifier,
                                    span: {
                                        start: token.pos,
                                        length: match[0].length
                                    }
                                });
                            else
                                // token.text = accessModifier + ' ' + staticModifier + restOfLine;
                                changes.push({
                                    newText: accessModifier + ' ' + staticModifier,
                                    span: {
                                        start: token.pos,
                                        length: match[0].length
                                    }
                                });
                        }
                    }
                }

                for (const pair of replacePairs) {
                    do {
                        match = pair[0].exec(token.text);
                        if (match)
                            changes.push({
                                newText: pair[1],
                                span: {
                                    start: token.pos + (match.index || 0),
                                    length: match[0].length
                                }
                            });
                    } while (match);
                }
            }
        }
    }

    // return tokens.map((tkn) => tkn.text).join('');
    return changes;
}

function removeMatchingBraces(tokens: Token[], startIndex: number): ts.TextChange[] {

    // console.log(tokens.reduce((count, token) => {
    //     if (token.type === TokenType.BraceOpen)
    //         count++;
    //     else if (token.type === TokenType.BraceClose)
    //         count--;
    //     return count;
    // }, 0) ? 'Mismatched braces' : 'Braces are ok');

    let braceOpenIndex = startIndex;
    // Find first open brace index
    if (tokens[braceOpenIndex].type !== TokenType.BraceOpen)
        for (let index = startIndex; index < tokens.length; index++)
            if (tokens[index].type === TokenType.BraceOpen) {
                braceOpenIndex = index;
                break;
            }

    // Find matching close brace index
    let braceCounter = 1;
    let braceCloseIndex = 0;
    // console.log('brace ' + braceCounter);
    for (let index = braceOpenIndex + 1; index < tokens.length; index++) {
        if (tokens[index].type === TokenType.BraceOpen) {
            braceCounter++;
            // console.log('brace++ ' + braceCounter);
        }
        else if (tokens[index].type === TokenType.BraceClose) {
            braceCounter--;
            // console.log('brace-- ' + braceCounter);
        }

        if (braceCounter === 0) {
            braceCloseIndex = index;
            break;
        }
    }

    if (braceCounter !== 0)
        throw new Error('Could not find matching closing brace. Mismatch count ' + braceCounter);

    // Remove braces
    // tokens.splice(braceOpenIndex, 1);
    // tokens.splice(breaceCloseIndex, 1);
    return [
        textChange(tokens[braceOpenIndex], ''),
        textChange(tokens[braceCloseIndex], ''),
    ];
}
