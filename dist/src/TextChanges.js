"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Creates new text by applying changes in order.
 * Changes need to be in descending order.
 * @param text
 * @param changes
 */
function applyTextChanges(text, changes) {
    let index = 0;
    let newText = '';
    let postText = '';
    for (const change of changes) {
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
exports.applyTextChanges = applyTextChanges;
function printTextChanges(text, changes) {
    let substr = '';
    for (const change of changes.sort()) {
        substr = text.substr(change.span.start, change.span.length);
        console.log(JSON.stringify(substr) + ' '.repeat(20 - substr.length) + '-> ' + JSON.stringify(change.newText));
    }
}
exports.printTextChanges = printTextChanges;
