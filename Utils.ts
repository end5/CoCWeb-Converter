import { StringStream } from "./StringStream";

export function trimLeft(strings: TemplateStringsArray, ...values: any[]) {
    return strings.reduce((prev, curr, index) => prev + curr.trimLeft() + (values[index] || ''), '');
}

export function escRegex(str: string): RegExp {
    return new RegExp(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
}

export function combineStrRegex(str: string, regex: RegExp): RegExp {
    return new RegExp(new RegExp(str).source + regex.source, 'g');
}

function getArgs(text: StringStream): string[] {
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
    let startMatch: RegExpMatchArray;
    let argsMatch: string[];
    let endMatch: RegExpMatchArray;
    let startMatchStr: string;
    let argsMatchStr: string;
    let endMatchStr: string;
    let replaceStr: string;

    do {
        startMatch = textStream.match(startRegex);
        if (startMatch) {
            startMatchStr = startMatch.shift();
            startPos = textStream.pos + startMatch.index;
            textStream.pos += startMatch.index + startMatchStr.length;

            argsMatch = getArgs(textStream);
            if (argsMatch !== undefined) {
                argsMatchStr = argsMatch.shift();
                textStream.pos += argsMatchStr.length;

                endMatch = textStream.match(endRegex);
                if (endMatch) {
                    endMatchStr = endMatch.shift();
                    textStream.pos += endMatch.index + endMatchStr.length;

                    replaceStr = callback.apply(undefined, [startMatchStr + argsMatchStr + endMatchStr].concat(startMatch, argsMatch, endMatch)) as string;

                    const offset = startMatchStr.length + argsMatchStr.length + endMatchStr.length;

                    textStream.splice(startPos, offset, replaceStr);

                    textStream.pos = startPos + replaceStr.length;
                }
            }
        }
    } while (!textStream.eos() && startMatch);

    return textStream.string();
}
