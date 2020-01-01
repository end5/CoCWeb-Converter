"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { TokenType, Token, tokenToString } from "./Token";
const Token_1 = require("./Token");
const Scanner_1 = require("./Scanner");
const TextChanges_1 = require("./TextChanges");
function replaceToken(token, text) {
    return {
        span: {
            start: token.start,
            length: token.length
        },
        newText: text || ''
    };
}
/**
 * Converts the text from AS3 to TS.
 * Removes 'package', 'import' and 'use'.
 * Converts types.
 * Anything found outside a class is converted to standalone
 * @param source File path
 */
class Converter {
    constructor(source) {
        this.changes = [];
        this.state = {
            braceCounter: 0,
            scope: [],
            newScope: undefined,
            rightBraceMod: [],
            className: ''
        };
        this.scanner = new Scanner_1.Scanner(source);
    }
    convert() {
        let pos;
        while (!this.scanner.eos()) {
            pos = this.scanner.pos;
            // console.log(tokenToString(this.scanner.peek(), this.scanner.text));
            // Scope does NOT match how scope is handled in the language
            switch (this.getScope()) {
                case 'program':
                    this.programScope();
                    break;
                case 'package':
                    this.packageScope();
                    break;
                case 'interface':
                    this.interfaceScope();
                    break;
                case 'class':
                    this.classScope();
                    break;
                case 'function':
                    this.functionScope();
                    break;
            }
            switch (this.scanner.peek().type) {
                case Token_1.TokenType.LEFTBRACE:
                    this.state.braceCounter++;
                    const leftBrace = this.scanner.consume();
                    if (this.state.newScope) {
                        // console.log('scope: ' + this.getScope() + ' -> ' + this.state.newScope.type);
                        if (this.state.newScope.type === 'package')
                            this.changes.push(replaceToken(leftBrace));
                        this.state.scope.push({ type: this.state.newScope.type, depth: this.state.braceCounter });
                        this.state.newScope = undefined;
                    }
                    break;
                case Token_1.TokenType.RIGHTBRACE:
                    const rightBrace = this.scanner.consume();
                    if (this.state.scope.length > 0) {
                        const scope = this.state.scope[this.state.scope.length - 1];
                        if (this.state.rightBraceMod.length > 0) {
                            const rightBraceMod = this.state.rightBraceMod[this.state.rightBraceMod.length - 1];
                            if (rightBraceMod.depth === this.state.braceCounter) {
                                this.changes.push(replaceToken(rightBrace, rightBraceMod.replace));
                                this.state.rightBraceMod.pop();
                            }
                        }
                        if (scope.depth === this.state.braceCounter) {
                            if (scope.type === 'package')
                                this.changes.push(replaceToken(rightBrace));
                            if (scope.type === 'class')
                                this.state.className = '';
                            this.state.scope.pop();
                            // console.log('scope: ' + this.getScope() + ' <- ' + scope.type);
                        }
                    }
                    this.state.braceCounter--;
                    break;
                case Token_1.TokenType.COLON:
                    this.scanner.consume();
                    const typeToken = this.scanner.peek();
                    const typeText = this.scanner.getTokenText();
                    this.replaceType();
                    if (typeText !== 'null' && this.scanner.consume(Token_1.TokenType.EQUALS) && this.scanner.consume(Token_1.TokenType.NULL))
                        this.changes.push(replaceToken(typeToken, typeText + ' | null'));
                    break;
                case Token_1.TokenType.IMPORT:
                    this.changes.push(replaceToken(this.scanner.consume()));
                    this.removeIdentifierChain();
                    break;
                case Token_1.TokenType.LEFTBRACKET:
                    let prev = this.scanner.consume();
                    if (this.scanner.match(Token_1.TokenType.IDENTIFIER, 'Embed')) {
                        this.changes.push(this.commentToken(prev));
                        let cur = this.scanner.consume();
                        if (this.scanner.text.substring(prev.start, cur.start).includes('\n'))
                            this.changes.push(this.commentToken(cur));
                        prev = cur;
                        let bracketCounter = 1;
                        while (bracketCounter > 0) {
                            cur = this.scanner.peek();
                            if (cur.type === Token_1.TokenType.LEFTBRACKET)
                                bracketCounter++;
                            else if (cur.type === Token_1.TokenType.RIGHTBRACKET)
                                bracketCounter--;
                            if (this.scanner.text.substring(prev.start, cur.start).includes('\n'))
                                this.changes.push(this.commentToken(cur));
                            prev = cur;
                            cur = this.scanner.consume();
                        }
                    }
                    else if (this.scanner.match(Token_1.TokenType.IDENTIFIER, 'Serialize')) {
                        this.changes.push(this.commentToken(prev));
                    }
                    break;
            }
            if (pos === this.scanner.pos)
                this.scanner.pos++;
        }
        return TextChanges_1.applyTextChanges(this.scanner.text, this.changes);
    }
    getScope() {
        if (this.state.scope.length > 0)
            return this.state.scope[this.state.scope.length - 1].type;
        return 'program';
    }
    programScope() {
        switch (this.scanner.peek().type) {
            case Token_1.TokenType.PACKAGE:
                const packageToken = this.scanner.consume();
                this.changes.push(replaceToken(packageToken));
                this.removeIdentifierChain();
                this.state.newScope = { type: 'package', token: packageToken };
                break;
        }
    }
    packageScope() {
        switch (this.scanner.peek().type) {
            case Token_1.TokenType.USE:
                // Simplifying this because only "use namespace kGAMECLASS" is found in CoC Vanilla code
                this.changes.push(replaceToken(this.scanner.consume())); // use
                this.changes.push(replaceToken(this.scanner.consume())); // namespace
                this.changes.push(replaceToken(this.scanner.consume())); // kGAMECLASS
                break;
            case Token_1.TokenType.CLASS:
                this.state.newScope = { type: 'class', token: this.scanner.consume() };
                break;
            case Token_1.TokenType.INCLUDE:
                this.changes.push(this.commentToken(this.scanner.consume()));
                break;
            case Token_1.TokenType.PUBLIC:
            case Token_1.TokenType.PROTECTED:
            case Token_1.TokenType.PRIVATE:
            case Token_1.TokenType.FUNCTION:
                this.declarationInPackage();
                break;
            case Token_1.TokenType.IDENTIFIER:
                if (!this.state.className && this.state.newScope && this.state.newScope.type === 'class') {
                    this.state.className = this.scanner.getTokenText();
                    // console.log('class name: ' + this.state.className);
                    this.scanner.consume();
                    break;
                }
            case Token_1.TokenType.STATIC:
                switch (this.scanner.getTokenText()) {
                    case 'override':
                    case 'internal':
                        this.declarationInPackage();
                        break;
                }
                break;
        }
    }
    interfaceScope() {
        switch (this.scanner.peek().type) {
            case Token_1.TokenType.FUNCTION:
                this.changes.push(replaceToken(this.scanner.consume()));
                break;
        }
    }
    classScope() {
        switch (this.scanner.peek().type) {
            case Token_1.TokenType.INCLUDE:
                this.changes.push(this.commentToken(this.scanner.consume()));
                break;
            case Token_1.TokenType.PUBLIC:
            case Token_1.TokenType.PROTECTED:
            case Token_1.TokenType.PRIVATE:
                this.declarationInClass();
                break;
            case Token_1.TokenType.IDENTIFIER:
                switch (this.scanner.getTokenText()) {
                    case 'flash_proxy':
                    case 'override':
                    case 'internal':
                        this.declarationInClass();
                        break;
                    case 'Vector':
                        this.replaceType();
                        break;
                    case 'CONFIG':
                        const config = this.scanner.consume();
                        this.changes.push(this.commentToken(config));
                        while (this.scanner.consume(Token_1.TokenType.DOUBLECOLON) || this.scanner.consume(Token_1.TokenType.IDENTIFIER))
                            ;
                        if (this.scanner.match(Token_1.TokenType.LEFTBRACE)) {
                            const leftBrace = this.scanner.peek();
                            if (this.scanner.text.substring(config.start, leftBrace.start).includes('\n'))
                                this.changes.push(this.commentToken(leftBrace));
                            this.state.rightBraceMod.push({ depth: this.state.braceCounter + 1, replace: '// }' });
                        }
                        break;
                }
                break;
        }
    }
    functionScope() {
        switch (this.scanner.peek().type) {
            case Token_1.TokenType.XMLMARKUP:
                const token = this.scanner.consume();
                this.changes.push(replaceToken(token, '`' + this.scanner.text.substr(token.start, token.length) + '`'));
                break;
            case Token_1.TokenType.FOR:
                this.scanner.consume();
                let isForEach = false;
                if (this.scanner.match(Token_1.TokenType.IDENTIFIER, 'each')) {
                    this.changes.push(replaceToken(this.scanner.consume()));
                    isForEach = true;
                }
                this.scanner.consume(Token_1.TokenType.LEFTPAREN);
                if (this.scanner.match(Token_1.TokenType.VAR))
                    this.changes.push(replaceToken(this.scanner.consume(), 'let'));
                this.scanner.consume(Token_1.TokenType.IDENTIFIER);
                // remove colon and type
                if (this.scanner.match(Token_1.TokenType.COLON)) {
                    this.changes.push(replaceToken(this.scanner.consume()));
                    this.changes.push(replaceToken(this.scanner.consume()));
                }
                if (isForEach) {
                    if (this.scanner.match(Token_1.TokenType.IN))
                        this.changes.push(replaceToken(this.scanner.consume(), 'of'));
                }
                break;
            case Token_1.TokenType.IDENTIFIER:
                switch (this.scanner.getTokenText()) {
                    case 'flash_proxy':
                    case 'override':
                    case 'internal':
                        this.declarationInClass();
                        break;
                    case 'Vector':
                        this.replaceType();
                        break;
                    case 'CONFIG':
                        const config = this.scanner.consume();
                        this.changes.push(this.commentToken(config));
                        while (this.scanner.consume(Token_1.TokenType.DOUBLECOLON) || this.scanner.consume(Token_1.TokenType.IDENTIFIER))
                            ;
                        if (this.scanner.match(Token_1.TokenType.LEFTBRACE)) {
                            const leftBrace = this.scanner.peek();
                            if (this.scanner.text.substring(config.start, leftBrace.start).includes('\n'))
                                this.changes.push(this.commentToken(leftBrace));
                            this.state.rightBraceMod.push({ depth: this.state.braceCounter + 1, replace: '// }' });
                        }
                        break;
                }
                break;
            case Token_1.TokenType.IS:
                this.changes.push(replaceToken(this.scanner.consume(), 'instanceof'));
                break;
            case Token_1.TokenType.DOUBLEDOT:
                this.changes.push(replaceToken(this.scanner.consume(), '.'));
                break;
            case Token_1.TokenType.ATSIGN:
                this.changes.push(replaceToken(this.scanner.consume()));
                break;
        }
    }
    replaceType() {
        switch (this.scanner.getTokenText()) {
            case 'Function':
                this.changes.push(replaceToken(this.scanner.consume(), '() => void'));
                break;
            case 'Boolean':
                this.changes.push(replaceToken(this.scanner.consume(), 'boolean'));
                break;
            case 'Number':
            case 'int':
                this.changes.push(replaceToken(this.scanner.consume(), 'number'));
                break;
            case 'uint':
                this.changes.push(replaceToken(this.scanner.consume(), 'number'));
                break;
            case 'String':
                this.changes.push(replaceToken(this.scanner.consume(), 'string'));
                break;
            case 'Array':
                this.changes.push(replaceToken(this.scanner.consume(), 'any[]'));
                break;
            case 'Object':
                this.changes.push(replaceToken(this.scanner.consume(), 'Record<string, any>'));
                break;
            case '*':
                this.changes.push(replaceToken(this.scanner.consume(), 'any'));
                break;
            case 'Vector':
                this.changes.push(replaceToken(this.scanner.consume(), 'Array'));
                if (this.scanner.match(Token_1.TokenType.DOTLESSTHAN)) {
                    this.changes.push(replaceToken(this.scanner.consume(), '<'));
                    this.replaceType();
                }
                break;
        }
    }
    removeIdentifierChain() {
        if (this.scanner.match(Token_1.TokenType.IDENTIFIER)) {
            this.changes.push(replaceToken(this.scanner.consume()));
            while (this.scanner.match(Token_1.TokenType.DOT)) {
                this.changes.push(replaceToken(this.scanner.consume()));
                if (this.scanner.match(Token_1.TokenType.IDENTIFIER)) {
                    this.changes.push(replaceToken(this.scanner.consume()));
                }
                else if (this.scanner.match(Token_1.TokenType.MULT)) {
                    this.changes.push(replaceToken(this.scanner.consume()));
                }
            }
        }
        if (this.scanner.match(Token_1.TokenType.SEMICOLON))
            this.changes.push(replaceToken(this.scanner.consume()));
    }
    declarationInPackage() {
        // Remove override
        const accessModifier = this.scanner.consume(Token_1.TokenType.PUBLIC) ||
            this.scanner.consume(Token_1.TokenType.PROTECTED) ||
            this.scanner.consume(Token_1.TokenType.PRIVATE) ||
            this.scanner.consume(Token_1.TokenType.IDENTIFIER, 'internal');
        const modifiers = [];
        while (this.scanner.match(Token_1.TokenType.IDENTIFIER))
            modifiers.push(this.scanner.consume());
        const declareToken = this.scanner.consume(Token_1.TokenType.FUNCTION) ||
            this.scanner.consume(Token_1.TokenType.VAR) ||
            this.scanner.consume(Token_1.TokenType.CLASS) ||
            this.scanner.consume(Token_1.TokenType.INTERFACE) ||
            this.scanner.consume(Token_1.TokenType.CONST);
        if (declareToken) {
            // public | internal -> export
            // protected | private -> ''
            if (accessModifier) {
                if (accessModifier.type === Token_1.TokenType.PUBLIC || this.scanner.getTokenText(accessModifier) === 'internal') {
                    this.changes.push(replaceToken(accessModifier, 'export'));
                }
                else {
                    this.changes.push(replaceToken(accessModifier));
                }
            }
            // final -> ''
            for (const modifier of modifiers)
                this.changes.push(replaceToken(modifier));
            // class -> class
            // interface -> interface
            // function | var | const -> function | var | const
            if (declareToken.type === Token_1.TokenType.CLASS) {
                this.state.newScope = { type: 'class', token: declareToken };
            }
            else if (declareToken.type === Token_1.TokenType.INTERFACE) {
                this.state.newScope = { type: 'interface', token: declareToken };
            }
            else if (declareToken.type === Token_1.TokenType.FUNCTION) {
                this.state.newScope = { type: 'function', token: declareToken };
            }
        }
    }
    declarationInClass() {
        this.scanner.consume(Token_1.TokenType.IDENTIFIER, 'flash_proxy');
        // Remove override
        const override = this.scanner.consume(Token_1.TokenType.IDENTIFIER, 'override');
        const accessModifier = this.scanner.consume(Token_1.TokenType.PUBLIC) ||
            this.scanner.consume(Token_1.TokenType.PROTECTED) ||
            this.scanner.consume(Token_1.TokenType.PRIVATE) ||
            this.scanner.consume(Token_1.TokenType.IDENTIFIER, 'internal');
        if (override && accessModifier) {
            this.changes.push(replaceToken(override));
        }
        const modifiers = [];
        while (this.scanner.match(Token_1.TokenType.IDENTIFIER))
            modifiers.push(this.scanner.consume());
        const declareToken = this.scanner.consume(Token_1.TokenType.FUNCTION) ||
            this.scanner.consume(Token_1.TokenType.VAR) ||
            this.scanner.consume(Token_1.TokenType.CONST);
        if (declareToken) {
            // internal -> public
            // public | protected | private -> public | protected | private
            // static -> static
            // override | virtual | final -> ''
            // function | var | const -> ''
            if (accessModifier) {
                if (this.scanner.getTokenText(accessModifier) === 'internal') {
                    this.changes.push(replaceToken(accessModifier, 'public'));
                }
                for (const modifier of modifiers)
                    if (this.scanner.getTokenText(modifier) !== 'static')
                        this.changes.push(replaceToken(modifier));
                this.changes.push(replaceToken(declareToken));
            }
            if (declareToken.type === Token_1.TokenType.FUNCTION) {
                this.state.newScope = { type: 'function', token: declareToken };
                if (this.scanner.getTokenText() === this.state.className) {
                    this.changes.push(replaceToken(this.scanner.consume(), 'constructor'));
                }
            }
        }
    }
    commentToken(token) {
        return replaceToken(token, '// ' + this.scanner.text.substring(token.start, token.start + token.length));
    }
}
exports.Converter = Converter;
