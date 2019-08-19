import * as child_process from "child_process";
import { Token, TokenType } from "./Token";

export class Scanner {
    public pos = 0;
    public readonly text: string;
    private list: Token[];

    public constructor(text: string, source: string) {
        this.text = text;
        const child = child_process.spawnSync(
            'java', ['-cp', 'tokenzier/external/*;tokenizer/bin;', 'app.App', source]
        );

        if (child.stderr)
            console.error(child.stderr.toString());

        this.list = JSON.parse(child.stdout.toString());
    }

    /**
     * Whether or not it is at the end of the stream.
     */
    public eos() {
        return this.pos >= this.list.length;
    }

    /**
     * Returns the current token.
     */
    public peek() {
        return this.list[this.pos];
    }

    /**
     * Consumes the token and returns it if there is a match.
     * @param type
     * @param str
     */
    public consume(): Token;
    public consume(type: TokenType, str?: string): Token | undefined;
    public consume(type?: TokenType, str?: string) {
        if (!type || (type && this.list[this.pos].type === type)) {
            if (!str || (str && this.list[this.pos].text === str)) {
                return this.list[this.pos++];
            }
        }
        return;
    }

    /**
     * Return true or false if the type and existing str match.
     * @param type
     * @param str
     */
    public match(type: TokenType, str?: string) {
        if (this.list[this.pos].type === type) {
            if (!str || (str && this.list[this.pos].text === str)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Increments the pos while the token type doesn't equal the specified type.
     * @param types
     */
    public eatWhileNot(...types: TokenType[]) {
        const dict = [];
        for (const type of types)
            dict[type] = type;

        while (!this.eos() && !dict[this.list[this.pos].type])
            this.pos++;
    }
}
