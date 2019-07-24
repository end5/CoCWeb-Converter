import { TextRange } from "./TextRange";

export enum TokenType {
    Code = 'code',
    Comment = 'comment',
    BraceOpen = 'bracket open',
    BraceClose = 'bracket close',
    String = 'string',
    Whitespace = 'whitespace',
    Newline = 'newline',
    Error = 'error'
}

export interface Token {
    type: TokenType;
    offset: number;
    range: TextRange;
    text: string;
}
