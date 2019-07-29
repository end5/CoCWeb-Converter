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
        token: { type: TokenType.String, offset: 0, range: new TextRange(), text: '' }
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
        offset: state.offset,
        range: new TextRange(start, { line: state.lineNum, col: stream.pos - state.offset }),
        text: stream.text().slice(startPos, stream.pos)
    };
}

enum TokenSymbol {
    Escape = '\\',
    Return = '\r',
    Newline = '\n',
    CommentStart = '/',
    BraceOpen = '{',
    BraceClose = '}',
    Quote = "'",
    DQuote = '"',
    Space = ' ',
    Tab = '\t',
}

function tokenize(stream: StringStream, state: LexerState) {
    if (stream.eat(TokenSymbol.Tab) || stream.eat(TokenSymbol.Space)) {
        while (stream.eat(TokenSymbol.Tab) || stream.eat(TokenSymbol.Space)) { }
        return TokenType.Whitespace;
    }
    else if (
        stream.eat(TokenSymbol.Newline) ||
        (stream.eat(TokenSymbol.Return) && stream.eat(TokenSymbol.Newline))
    ) {
        return TokenType.Newline;
    }
    else if (stream.eat(TokenSymbol.DQuote)) {
        while (!stream.eos()) {
            if (stream.eatWhileNot(TokenSymbol.DQuote)) {
                // Pos moved. Check for escaped quotes.
                stream.pos--;
                if (stream.eat(TokenSymbol.Escape)) {
                    stream.eat(TokenSymbol.DQuote);
                }
                else {
                    // No escaped quote
                    stream.pos++;
                    stream.eat(TokenSymbol.DQuote);
                    return TokenType.String;
                }
            }
            else {
                // Pos didn't move. Error on quote not found.
                if (!stream.eat(TokenSymbol.DQuote))
                    throw new Error('Could not close quotes');
                else
                    return TokenType.String;
            }
        }
        return TokenType.String;
    }
    else if (stream.eat(TokenSymbol.Quote)) {
        while (!stream.eos()) {
            if (stream.eatWhileNot(TokenSymbol.Quote)) {
                // Pos moved. Check for escaped quotes.
                stream.pos--;
                if (stream.eat(TokenSymbol.Escape)) {
                    stream.eat(TokenSymbol.Quote);
                }
                else {
                    // No escaped quote
                    stream.pos++;
                    stream.eat(TokenSymbol.Quote);
                    return TokenType.String;
                }
            }
            else {
                // Pos didn't move. Error on quote not found.
                if (!stream.eat(TokenSymbol.Quote))
                    throw new Error('Could not close quotes');
                else
                    return TokenType.String;
            }
        }
        return TokenType.String;
    }
    else if (stream.eat(TokenSymbol.BraceOpen))
        return TokenType.BraceOpen;
    else if (stream.eat(TokenSymbol.BraceClose))
        return TokenType.BraceClose;
    else if (stream.eat(TokenSymbol.CommentStart)) {
        // Block comment
        if (stream.eat('*')) {
            while (!stream.eos()) {
                stream.eatWhileNot('*');
                if (stream.eat('*')) {
                    if (stream.eat('/'))
                        return TokenType.Comment;
                }
            }
            return TokenType.Comment;
        }
        // Line comment
        else if (stream.eat('/')) {
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
        TokenSymbol.CommentStart
    ))
        return TokenType.Code;
    return TokenType.Error;
}
