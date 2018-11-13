export class StringStream {
    public pos: number = 0;
    private str: string;

    public constructor(str: string) {
        this.str = str;
    }

    private advStream(amount?: number) {
        this.pos += +amount;
    }

    /**
     * Returns true only if the stream is at the end of the string.
     */
    public string(): string {
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
        return this.str[this.pos];
    }

    /**
     * Returns the next character in the stream and advances it. Returns undefined when at end of string
     */
    public next(): string {
        if (!this.eos()) {
            const char = this.str[this.pos];
            this.advStream();
            return char;
        }
    }

    /**
     * If the next character in the stream 'matches' the given argument, it is consumed and returned.
     * Otherwise, undefined is returned.
     * @param match A character or regular expression
     */
    public eat(match: string | RegExp): string {
        if (match instanceof RegExp && match.test(this.str[this.pos])) return this.next();
        else if (this.str[this.pos] === match) return this.next();
    }

    /**
     * Repeatedly calls eat with the given argument, until it fails. Returns true if any characters were eaten.
     * @param match A character or regular expression
     */
    public eatWhile(match: string | RegExp): boolean {
        const startPos = this.pos;
        while (this.eat(match)) { }
        return this.pos > startPos;
    }

    /**
     * Advances stream pos to end of first match. If string is passed, it is converted to a RegExg.
     * @param pattern A string or RegExg
     */
    public match(pattern: RegExp): RegExpMatchArray {
        const match = pattern.exec(this.str.slice(this.pos));
        if (match) {
            // this.advStream(match.index);
            return match;
        }
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
    public splice(start: number, deleteCount?: number, ...items: string[]): string {
        const out = this.str.slice(start, start + deleteCount);
        this.str = this.str.slice(0, start) + items.join('') + this.str.slice(start + deleteCount);
        return out;
    }
}
