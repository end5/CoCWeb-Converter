import { StringStream } from "../../Lexer/StringStream";

export function trimLeft(strings: TemplateStringsArray, ...values: any[]) {
    return strings.reduce((prev, curr, index) => prev + curr.trimLeft() + (values[index] || ''), '');
}

export function escRegex(str: string): RegExp {
    return new RegExp(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
}

export function combineStrRegex(str: string, regex: RegExp): RegExp {
    return new RegExp(new RegExp(str).source + regex.source, 'g');
}

/**
 * 0: total match
 * 1...n: each match
 * @param text
 */
function getArgs(text: StringStream): string[] | undefined {
    const startPos = text.pos;
    const args = [];
    let matchStr;
    let bracketCount = 1;
    let quote = false;
    let dquote = false;
    let escape = false;
    let lastArg = startPos;
    while (bracketCount > 0) {
        if (text.eos()) {
            text.pos = startPos;
            return;
        }
        if (escape)
            escape = false;
        else if (text.peek() === '\\')
            escape = true;
        else if (!quote && !dquote) {
            if (text.peek() === '"')
                dquote = true;
            else if (text.peek() === "'")
                quote = true;
            else if (text.peek() === '(')
                bracketCount++;
            else if (text.peek() === ')')
                bracketCount--;
            else if (text.peek() === ',' && bracketCount === 1) {
                matchStr = text.substr(lastArg, text.pos).trim();
                if (matchStr !== '')
                    args.push(matchStr);
                lastArg = text.pos + 1;
            }
        }
        else {
            if (!quote && text.peek() === '"')
                dquote = false;
            else if (!dquote && text.peek() === "'")
                quote = false;
        }
        text.pos++;
    }
    if (bracketCount === 0)
        text.pos--;
    matchStr = text.substr(lastArg, text.pos).trim();
    if (matchStr !== '')
        args.push(matchStr);
    args.unshift(text.substr(startPos, text.pos));
    text.pos = startPos;
    return args;
}

// const test = `power(1,2,3);`;
// console.log(funcReplacer(test, 'power(', /\):(\w+)/, (match, arg1, end) => 'power:=' + arg1 + '->' + end));

export function funcReplacer(text: string, start: string | RegExp, end: string | RegExp, callback: (match: string, ...args: string[]) => string): string {
    const textStream = new StringStream(text);
    const startRegex = new RegExp(typeof start === 'string' ? escRegex(start).source : start.source);
    const endRegex = new RegExp(typeof end === 'string' ? escRegex(end).source : end.source);
    let startPos: number;
    let startMatch: RegExpMatchArray | undefined;
    let argsMatch: string[] | undefined;
    let endMatch: RegExpMatchArray | undefined;
    let startMatchStr: string;
    let argsMatchStr: string;
    let endMatchStr: string;
    let replaceStr: string;

    do {
        startMatch = textStream.match(startRegex);
        if (startMatch && startMatch.index !== undefined && startMatch.length > 0) {
            startMatchStr = startMatch.shift()!;
            if (startMatchStr.split('\n').length > 1)
                console.error('Warning: Large match\nFunction Match:', start, end, '\nStart Match:', startMatchStr);
            startPos = textStream.pos + startMatch.index;
            textStream.pos += startMatch.index + startMatchStr.length;

            argsMatch = getArgs(textStream);
            if (argsMatch !== undefined && argsMatch.length > 0) {
                argsMatchStr = argsMatch.shift()!;
                if (argsMatchStr.split('\n').length > 1)
                    console.error('Warning: Large match\nFunction Match:', start, end, '\nArgs Match:', argsMatchStr);
                textStream.pos += argsMatchStr.length;

                endMatch = textStream.match(endRegex);
                if (endMatch && endMatch.index !== undefined && endMatch.length > 0) {
                    endMatchStr = endMatch.shift()!;
                    if (endMatchStr.split('\n').length > 1)
                        console.error('Warning: Large match\nFunction Match:', start, end, '\nEnd Match:', endMatchStr);
                    textStream.pos += endMatch.index + endMatchStr.length;

                    replaceStr = callback.apply(undefined, [startMatchStr + argsMatchStr + endMatchStr, ...[...startMatch, ...argsMatch, ...endMatch]]);

                    const offset = startMatchStr.length + argsMatchStr.length + endMatchStr.length;

                    textStream.splice(startPos, offset, replaceStr);

                    textStream.pos = startPos + replaceStr.length;
                }
            }
        }
    } while (!textStream.eos() && startMatch);

    return textStream.text();
}
