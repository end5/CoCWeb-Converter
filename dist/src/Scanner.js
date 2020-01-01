"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
class Scanner {
    constructor(source) {
        // const child = child_process.spawnSync(
        //     'java', ['-cp', 'tokenizer/external/*;tokenizer/bin;', 'app.App', source]
        // );
        this.pos = 0;
        // if (child.stderr)
        //     console.error(child.stderr.toString());
        // const obj: { list: Token[], text: string } = JSON.parse(child.stdout.toString());
        const tokenPath = source.replace('.as', '.tkns');
        if (!fs_1.existsSync(tokenPath))
            throw new Error('Token file does not exist. Please run tokenizer');
        this.list = JSON.parse(fs_1.readFileSync(tokenPath).toLocaleString());
        let text = fs_1.readFileSync(source).toString();
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }
        this.text = text;
    }
    /**
     * Whether or not it is at the end of the stream.
     */
    eos() {
        return this.pos >= this.list.length;
    }
    /**
     * Returns the current token.
     */
    peek() {
        return this.list[this.pos];
    }
    consume(type, str) {
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
    getTokenText(token) {
        token = token || this.list[this.pos];
        return this.text.substr(token.start, token.length);
    }
    /**
     * Return true or false if the type and existing str match.
     * @param type
     * @param str
     */
    match(type, str) {
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
    eatWhileNot(...types) {
        const dict = [];
        for (const type of types)
            dict[type] = type;
        while (!this.eos() && !dict[this.list[this.pos].type])
            this.pos++;
    }
}
exports.Scanner = Scanner;
