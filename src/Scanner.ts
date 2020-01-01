// import * as child_process from "child_process";
import { Token, TokenType } from "./Token";
import { readFileSync, existsSync } from "fs";

export class Scanner {
    public pos = 0;
    public readonly text: string;
    public list: Token[];

    public constructor(source: string) {
        // const child = child_process.spawnSync(
        //     'java', ['-cp', 'tokenizer/external/*;tokenizer/bin;', 'app.App', source]
        // );

        // if (child.stderr)
        //     console.error(child.stderr.toString());

        // const obj: { list: Token[], text: string } = JSON.parse(child.stdout.toString());

        const tokenPath = source.replace('.as', '.tkns');
        if (!existsSync(tokenPath))
            throw new Error('Token file does not exist. Please run tokenizer');

        this.list = JSON.parse(readFileSync(tokenPath).toLocaleString());
        
        let text = readFileSync(source).toString();
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }
        this.text = text;
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
            if (!str || (str && this.getTokenText() === str)) {
                return this.list[this.pos++];
            }
        }
        return;
    }

    /**
     * Get the text of the token. No token is current token.
     * @param token
     */
    public getTokenText(token?: Token) {
        token = token || this.list[this.pos];
        return this.text.substr(token.start, token.length);
    }

    /**
     * Return true or false if the type and existing str match.
     * @param type
     * @param str
     */
    public match(type: TokenType, str?: string) {
        if (this.list[this.pos].type === type) {
            if (!str || (str && this.getTokenText() === str)) {
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
