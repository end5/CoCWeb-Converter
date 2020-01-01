import { Token, TokenType } from "./Token";
export declare class Scanner {
    pos: number;
    readonly text: string;
    list: Token[];
    constructor(source: string);
    /**
     * Whether or not it is at the end of the stream.
     */
    eos(): boolean;
    /**
     * Returns the current token.
     */
    peek(): Token;
    /**
     * Consumes the token and returns it if there is a match.
     * @param type
     * @param str
     */
    consume(): Token;
    consume(type: TokenType, str?: string): Token | undefined;
    /**
     * Get the text of the token. No token is current token.
     * @param token
     */
    getTokenText(token?: Token): string;
    /**
     * Return true or false if the type and existing str match.
     * @param type
     * @param str
     */
    match(type: TokenType, str?: string): boolean;
    /**
     * Increments the pos while the token type doesn't equal the specified type.
     * @param types
     */
    eatWhileNot(...types: TokenType[]): void;
}
