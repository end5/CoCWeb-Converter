import * as ts from "typescript";

// console.log(applyTextChanges('0123456789', [{
//     span: {
//         start: 1,
//         length: 2
//     },
//     newText: 'a'
// }, {
//     span: {
//         start: 7,
//         length: 1
//     },
//     newText: 'b'
// }]));

export function applyTextChanges(text: string, changes: ts.TextChange[]) {
    console.log(changes);
    const sortedChanges = changes.sort((a, b) => a.span.start - b.span.start);
    let index = 0;
    let newText = '';
    for (const change of sortedChanges) {
        console.log(index, newText);
        newText += text.slice(index, change.span.start) + change.newText;
        index = change.span.start + change.span.length;
        console.log(index, newText);
    }
    return newText + text.slice(index);
}
