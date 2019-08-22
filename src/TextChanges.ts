import * as ts from "typescript";

export function applyTextChanges(text: string, changes: ts.TextChange[]) {
    // console.log(changes);
    const sortedChanges = changes.sort((a, b) => a.span.start - b.span.start);
    // const sortedChanges = changes;
    let index = 0;
    let newText = '';
    let postText = '';
    for (const change of sortedChanges) {
        // console.log(index, newText, postText);
        if (change.span.start >= text.length)
            postText += change.newText;
        else {
            newText += text.slice(index, change.span.start) + change.newText;
            index = change.span.start + change.span.length;
        }
        // console.log(index, newText, postText);
    }
    return newText + text.slice(index) + postText;
}

export function printTextChanges(text: string, changes: ts.TextChange[]) {
    let substr = '';
    for (const change of changes.sort()) {
        substr = text.substr(change.span.start, change.span.length);
        console.log(JSON.stringify(substr) + ' '.repeat(20 - substr.length) + '-> ' + JSON.stringify(change.newText));
    }
}
