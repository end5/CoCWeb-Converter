import * as ts from "typescript";
import { Token } from "./Token";

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

export class TokenChanger {
    private list: ts.TextChange[] = [];

    public constructor(
        public readonly text: string
    ) { }

    public getChanges() {
        return this.list;
    }

    /**
     * Adds a change for the token's range.
     * @param newText Replacement text
     * @param token Optional token
     */
    public add(token: Token, text?: string) {
        this.list.push({
            span: {
                start: token.start,
                length: token.text.length
            },
            newText: text || ''
        });
    }

    /**
     * Apply the accumulated changes.
     */
    public apply() {
        // console.log(changes);
        const sortedChanges = this.list.sort((a, b) => a.span.start - b.span.start);
        // const sortedChanges = changes;
        let index = 0;
        let newText = '';
        let postText = '';
        for (const change of sortedChanges) {
            // console.log(index, newText, postText);
            if (change.span.start >= this.text.length)
                postText += change.newText;
            else {
                newText += this.text.slice(index, change.span.start) + change.newText;
                index = change.span.start + change.span.length;
            }
            // console.log(index, newText, postText);
        }
        return newText + this.text.slice(index) + postText;
    }
}
