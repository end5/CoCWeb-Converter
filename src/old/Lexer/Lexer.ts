import { StringStream } from './StringStream';
import { TokenType, Token } from './Token';
import { TextRange } from './TextRange';

export interface LexerState {
    lineNum: number;
    offset: number;
    token: Token;
}

export function lex(text: string): Token[];
export function lex(text: string, returnStates: boolean): LexerState[];
export function lex(text: string, returnStates?: boolean): Token[] | LexerState[] {
    const tokens: Token[] = [];
    const states: LexerState[] = [];
    const stream = new StringStream(text);
    const state: LexerState = {
        lineNum: 0,
        offset: 0,
        token: { type: TokenType.String, pos: 0, range: new TextRange(), text: '' }
    };

    while (!stream.eos()) {
        state.token = createToken(stream, state);

        // if (returnStates)
        //     state.text = text.slice(state.token.range.start.col + state.offset, state.token.range.end.col + state.offset);

        // Force the stream position forward if nothing matched
        if (state.token.range.start.line === state.token.range.end.line && state.token.range.start.col === state.token.range.end.col)
            stream.pos++;

        tokens.push(state.token);

        if (returnStates)
            states.push(JSON.parse(JSON.stringify(state)));

        if (state.token.type === TokenType.Newline) {
            state.lineNum++;
            state.offset = stream.pos;
        }
    }

    if (returnStates)
        return states;

    return tokens;
}

function createToken(stream: StringStream, state: LexerState): Token {
    const startPos = stream.pos;
    const start = { line: state.lineNum, col: stream.pos - state.offset };
    return {
        type: tokenize(stream, state),
        pos: startPos,
        range: new TextRange(start, { line: state.lineNum, col: stream.pos - state.offset }),
        text: stream.text().slice(startPos, stream.pos)
    };
}

enum TokenSymbol {
    Escape = '\\',
    Return = '\r',
    Newline = '\n',
    WindowsNewline = '\r\n',
    ForwardSlash = '/',
    Aterisk = '*',
    BraceOpen = '{',
    BraceClose = '}',
    Quote = "'",
    DQuote = '"',
    Space = ' ',
    Tab = '\t',
}

function tokenize(stream: StringStream, state: LexerState) {
    if (
        stream.eat(TokenSymbol.Newline) ||
        stream.eat(TokenSymbol.WindowsNewline)
    ) {
        return TokenType.Newline;
    }
    if (stream.eat(TokenSymbol.Tab) || stream.eat(TokenSymbol.Space)) {
        while (stream.eat(TokenSymbol.Tab) || stream.eat(TokenSymbol.Space)) { }
        return TokenType.Whitespace;
    }
    else if (stream.eat(TokenSymbol.DQuote)) {
        while (!stream.eos()) {
            if (stream.eatWhileNot(TokenSymbol.Escape, TokenSymbol.DQuote)) {
                if (stream.eat(TokenSymbol.DQuote)) {
                    return TokenType.String;
                }
                else if (stream.eat(TokenSymbol.Escape)) {
                    stream.pos++;
                }
            }
            else {
                if (stream.eat(TokenSymbol.DQuote)) {
                    return TokenType.String;
                }
                else if (stream.eat(TokenSymbol.Escape)) {
                    stream.pos++;
                }
                // Pos didn't move. Error because quote was not found.
                else
                    throw new Error('Could not close quotes starting on line ' + state.lineNum);
            }
        }
        throw new Error('Could not close quotes starting on line ' + state.lineNum);
    }
    else if (stream.eat(TokenSymbol.Quote)) {
        while (!stream.eos()) {
            if (stream.eatWhileNot(TokenSymbol.Escape, TokenSymbol.Quote)) {
                if (stream.eat(TokenSymbol.Quote)) {
                    return TokenType.String;
                }
                else if (stream.eat(TokenSymbol.Escape)) {
                    stream.pos++;
                }
            }
            else {
                if (stream.eat(TokenSymbol.Quote)) {
                    return TokenType.String;
                }
                else if (stream.eat(TokenSymbol.Escape)) {
                    stream.pos++;
                }
                // Pos didn't move. Error because quote was not found.
                else
                    throw new Error('Could not close quotes');
            }
        }
        throw new Error('Could not close quotes outer');
    }
    else if (stream.eat(TokenSymbol.BraceOpen))
        return TokenType.BraceOpen;
    else if (stream.eat(TokenSymbol.BraceClose))
        return TokenType.BraceClose;
    // Comments
    else if (stream.eat(TokenSymbol.ForwardSlash)) {
        // Block comment
        if (stream.eat(TokenSymbol.Aterisk)) {
            while (!stream.eos()) {
                stream.eatWhileNot(TokenSymbol.Aterisk);
                if (stream.eat(TokenSymbol.Aterisk)) {
                    if (stream.eat(TokenSymbol.ForwardSlash))
                        return TokenType.Comment;
                }
            }
            return TokenType.Comment;
        }
        // Line comment
        else if (stream.eat(TokenSymbol.ForwardSlash)) {
            stream.eatWhileNot(TokenSymbol.Newline);
            return TokenType.Comment;
        }
    }
    if (stream.eatWhileNot(
        TokenSymbol.Return,
        TokenSymbol.Newline,
        TokenSymbol.DQuote,
        TokenSymbol.Quote,
        TokenSymbol.BraceOpen,
        TokenSymbol.BraceClose,
        TokenSymbol.ForwardSlash
    ))
        return TokenType.Code;
    return TokenType.Error;
}
