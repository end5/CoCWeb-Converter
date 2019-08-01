export class StringStream {
    public pos: number = 0;
    private str: string;

    public constructor(str: string) {
        this.str = str;
    }

    /**
     * Retruns the text.
     */
    public text(): string {
        return this.str;
    }

    /**
     * Returns true only if the stream is at the end of the string.
     */
    public eos(): boolean {
        return this.pos >= this.str.length;
    }

    /**
     * Returns the next character in the stream without advancing it. Returns undefined when at end of file
     */
    public peek(): string {
        return this.str.charAt(this.pos);
    }

    /**
     * If the next character in the stream 'matches' the given argument, it is consumed and returned.
     * Otherwise, undefined is returned.
     * @param match A character
     */
    public eat(match: string): string | undefined {
        if (this.str.charAt(this.pos) === match) return this.str.charAt(this.pos++);
        return;
    }

    /**
     * Repeatedly eats characters that do not match the given characters. Returns true if any characters were eaten.
     * @param notChars Characters that do not match the string
     */
    public eatWhileNot(...notChars: string[]): boolean {
        const startPos = this.pos;
        let index = startPos;
        let matchFound = false;

        for (const char of notChars) {
            index = this.str.indexOf(char, startPos);

            // Match was found
            if (index > -1) {
                matchFound = true;
                // char found at start position
                // cannnot progress
                if (index === startPos) {
                    this.pos = startPos;
                    break;
                }
                // Match found at farther position
                if (this.pos > index || this.pos === startPos)
                    this.pos = index;
            }
        }

        // Nothing matched so the rest of the string is ok
        if (!matchFound)
            this.pos = this.str.length;

        return this.pos > startPos;
    }

    /**
     * Advances stream pos to end of first match. If string is passed, it is converted to a RegExg.
     * @param pattern A string or RegExg
     */
    public match(pattern: RegExp): RegExpMatchArray | undefined {
        const match = pattern.exec(this.str.slice(this.pos));
        if (match) {
            // this.advStream(match.index);
            return match;
        }
        return;
    }

    /**
     * Returns a sub string. If no end is passed, end of string is used.
     * @param start The start pos of the sub string.
     * @param end Optional: The end pos of the sub string.
     */
    public substr(start: number, end?: number): string {
        return this.str.slice(start, end);
    }

    /**
     * Removes characters from the string and, if necessary, inserts new strings in their place, returning the deleted elements.
     * @param start The zero-based location in the strings from which to start removing elements.
     * @param deleteCount The number of characters to remove.
     * @param items Elements to insert into the strings in place of the deleted elements.
     */
    public splice(start: number, deleteCount: number = 0, ...items: string[]): string {
        const out = this.str.slice(start, start + deleteCount);
        this.str = this.str.slice(0, start) + items.join('') + this.str.slice(start + deleteCount);
        return out;
    }
}
