"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// From https://github.com/apache/flex-sdk/blob/master/modules/asc/src/java/macromedia/asc/parser/Tokens.java
var TokenType;
(function (TokenType) {
    TokenType[TokenType["FIRST"] = 1] = "FIRST";
    TokenType[TokenType["EOS"] = 1] = "EOS";
    TokenType[TokenType["MINUS"] = 2] = "MINUS";
    TokenType[TokenType["MINUSMINUS"] = 3] = "MINUSMINUS";
    TokenType[TokenType["NOT"] = 4] = "NOT";
    TokenType[TokenType["NOTEQUALS"] = 5] = "NOTEQUALS";
    TokenType[TokenType["STRICTNOTEQUALS"] = 6] = "STRICTNOTEQUALS";
    TokenType[TokenType["MODULUS"] = 7] = "MODULUS";
    TokenType[TokenType["MODULUSASSIGN"] = 8] = "MODULUSASSIGN";
    TokenType[TokenType["BITWISEAND"] = 9] = "BITWISEAND";
    TokenType[TokenType["LOGICALAND"] = 10] = "LOGICALAND";
    TokenType[TokenType["LOGICALANDASSIGN"] = 11] = "LOGICALANDASSIGN";
    TokenType[TokenType["BITWISEANDASSIGN"] = 12] = "BITWISEANDASSIGN";
    TokenType[TokenType["LEFTPAREN"] = 13] = "LEFTPAREN";
    TokenType[TokenType["RIGHTPAREN"] = 14] = "RIGHTPAREN";
    TokenType[TokenType["MULT"] = 15] = "MULT";
    TokenType[TokenType["MULTASSIGN"] = 16] = "MULTASSIGN";
    TokenType[TokenType["COMMA"] = 17] = "COMMA";
    TokenType[TokenType["DOT"] = 18] = "DOT";
    TokenType[TokenType["DOUBLEDOT"] = 19] = "DOUBLEDOT";
    TokenType[TokenType["TRIPLEDOT"] = 20] = "TRIPLEDOT";
    TokenType[TokenType["DOTLESSTHAN"] = 21] = "DOTLESSTHAN";
    TokenType[TokenType["DIV"] = 22] = "DIV";
    TokenType[TokenType["DIVASSIGN"] = 23] = "DIVASSIGN";
    TokenType[TokenType["COLON"] = 24] = "COLON";
    TokenType[TokenType["DOUBLECOLON"] = 25] = "DOUBLECOLON";
    TokenType[TokenType["SEMICOLON"] = 26] = "SEMICOLON";
    TokenType[TokenType["QUESTIONMARK"] = 27] = "QUESTIONMARK";
    TokenType[TokenType["ATSIGN"] = 28] = "ATSIGN";
    TokenType[TokenType["LEFTBRACKET"] = 29] = "LEFTBRACKET";
    TokenType[TokenType["RIGHTBRACKET"] = 30] = "RIGHTBRACKET";
    TokenType[TokenType["BITWISEXOR"] = 31] = "BITWISEXOR";
    TokenType[TokenType["LOGICALXOR"] = 32] = "LOGICALXOR";
    TokenType[TokenType["LOGICALXORASSIGN"] = 33] = "LOGICALXORASSIGN";
    TokenType[TokenType["BITWISEXORASSIGN"] = 34] = "BITWISEXORASSIGN";
    TokenType[TokenType["LEFTBRACE"] = 35] = "LEFTBRACE";
    TokenType[TokenType["BITWISEOR"] = 36] = "BITWISEOR";
    TokenType[TokenType["LOGICALOR"] = 37] = "LOGICALOR";
    TokenType[TokenType["LOGICALORASSIGN"] = 38] = "LOGICALORASSIGN";
    TokenType[TokenType["BITWISEORASSIGN"] = 39] = "BITWISEORASSIGN";
    TokenType[TokenType["RIGHTBRACE"] = 40] = "RIGHTBRACE";
    TokenType[TokenType["BITWISENOT"] = 41] = "BITWISENOT";
    TokenType[TokenType["PLUS"] = 42] = "PLUS";
    TokenType[TokenType["PLUSPLUS"] = 43] = "PLUSPLUS";
    TokenType[TokenType["PLUSASSIGN"] = 44] = "PLUSASSIGN";
    TokenType[TokenType["LESSTHAN"] = 45] = "LESSTHAN";
    TokenType[TokenType["LEFTSHIFT"] = 46] = "LEFTSHIFT";
    TokenType[TokenType["LEFTSHIFTASSIGN"] = 47] = "LEFTSHIFTASSIGN";
    TokenType[TokenType["LESSTHANOREQUALS"] = 48] = "LESSTHANOREQUALS";
    TokenType[TokenType["ASSIGN"] = 49] = "ASSIGN";
    TokenType[TokenType["MINUSASSIGN"] = 50] = "MINUSASSIGN";
    TokenType[TokenType["EQUALS"] = 51] = "EQUALS";
    TokenType[TokenType["STRICTEQUALS"] = 52] = "STRICTEQUALS";
    TokenType[TokenType["GREATERTHAN"] = 53] = "GREATERTHAN";
    TokenType[TokenType["GREATERTHANOREQUALS"] = 54] = "GREATERTHANOREQUALS";
    TokenType[TokenType["RIGHTSHIFT"] = 55] = "RIGHTSHIFT";
    TokenType[TokenType["RIGHTSHIFTASSIGN"] = 56] = "RIGHTSHIFTASSIGN";
    TokenType[TokenType["UNSIGNEDRIGHTSHIFT"] = 57] = "UNSIGNEDRIGHTSHIFT";
    TokenType[TokenType["UNSIGNEDRIGHTSHIFTASSIGN"] = 58] = "UNSIGNEDRIGHTSHIFTASSIGN";
    TokenType[TokenType["ABSTRACT"] = 59] = "ABSTRACT";
    TokenType[TokenType["AS"] = 60] = "AS";
    TokenType[TokenType["BREAK"] = 61] = "BREAK";
    TokenType[TokenType["CASE"] = 62] = "CASE";
    TokenType[TokenType["CATCH"] = 63] = "CATCH";
    TokenType[TokenType["CLASS"] = 64] = "CLASS";
    TokenType[TokenType["CONST"] = 65] = "CONST";
    TokenType[TokenType["CONTINUE"] = 66] = "CONTINUE";
    TokenType[TokenType["DEBUGGER"] = 67] = "DEBUGGER";
    TokenType[TokenType["DEFAULT"] = 68] = "DEFAULT";
    TokenType[TokenType["DELETE"] = 69] = "DELETE";
    TokenType[TokenType["DO"] = 70] = "DO";
    TokenType[TokenType["ELSE"] = 71] = "ELSE";
    TokenType[TokenType["ENUM"] = 72] = "ENUM";
    TokenType[TokenType["EXTENDS"] = 73] = "EXTENDS";
    TokenType[TokenType["FALSE"] = 74] = "FALSE";
    TokenType[TokenType["FINAL"] = 75] = "FINAL";
    TokenType[TokenType["FINALLY"] = 76] = "FINALLY";
    TokenType[TokenType["FOR"] = 77] = "FOR";
    TokenType[TokenType["FUNCTION"] = 78] = "FUNCTION";
    TokenType[TokenType["GET"] = 79] = "GET";
    TokenType[TokenType["GOTO"] = 80] = "GOTO";
    TokenType[TokenType["IF"] = 81] = "IF";
    TokenType[TokenType["IMPLEMENTS"] = 82] = "IMPLEMENTS";
    TokenType[TokenType["IMPORT"] = 83] = "IMPORT";
    TokenType[TokenType["IN"] = 84] = "IN";
    TokenType[TokenType["INCLUDE"] = 85] = "INCLUDE";
    TokenType[TokenType["INSTANCEOF"] = 86] = "INSTANCEOF";
    TokenType[TokenType["INTERFACE"] = 87] = "INTERFACE";
    TokenType[TokenType["IS"] = 88] = "IS";
    TokenType[TokenType["NAMESPACE"] = 89] = "NAMESPACE";
    TokenType[TokenType["CONFIG"] = 90] = "CONFIG";
    TokenType[TokenType["NATIVE"] = 91] = "NATIVE";
    TokenType[TokenType["NEW"] = 92] = "NEW";
    TokenType[TokenType["NULL"] = 93] = "NULL";
    TokenType[TokenType["PACKAGE"] = 94] = "PACKAGE";
    TokenType[TokenType["PRIVATE"] = 95] = "PRIVATE";
    TokenType[TokenType["PROTECTED"] = 96] = "PROTECTED";
    TokenType[TokenType["PUBLIC"] = 97] = "PUBLIC";
    TokenType[TokenType["RETURN"] = 98] = "RETURN";
    TokenType[TokenType["SET"] = 99] = "SET";
    TokenType[TokenType["STATIC"] = 100] = "STATIC";
    TokenType[TokenType["SUPER"] = 101] = "SUPER";
    TokenType[TokenType["SWITCH"] = 102] = "SWITCH";
    TokenType[TokenType["SYNCHRONIZED"] = 103] = "SYNCHRONIZED";
    TokenType[TokenType["THIS"] = 104] = "THIS";
    TokenType[TokenType["THROW"] = 105] = "THROW";
    TokenType[TokenType["THROWS"] = 106] = "THROWS";
    TokenType[TokenType["TRANSIENT"] = 107] = "TRANSIENT";
    TokenType[TokenType["TRUE"] = 108] = "TRUE";
    TokenType[TokenType["TRY"] = 109] = "TRY";
    TokenType[TokenType["TYPEOF"] = 110] = "TYPEOF";
    TokenType[TokenType["USE"] = 111] = "USE";
    TokenType[TokenType["VAR"] = 112] = "VAR";
    TokenType[TokenType["VOID"] = 113] = "VOID";
    TokenType[TokenType["VOLATILE"] = 114] = "VOLATILE";
    TokenType[TokenType["WHILE"] = 115] = "WHILE";
    TokenType[TokenType["WITH"] = 116] = "WITH";
    TokenType[TokenType["IDENTIFIER"] = 117] = "IDENTIFIER";
    TokenType[TokenType["NUMBERLITERAL"] = 118] = "NUMBERLITERAL";
    TokenType[TokenType["REGEXPLITERAL"] = 119] = "REGEXPLITERAL";
    TokenType[TokenType["STRINGLITERAL"] = 120] = "STRINGLITERAL";
    TokenType[TokenType["NEGMINLONGLITERAL"] = 121] = "NEGMINLONGLITERAL";
    TokenType[TokenType["XMLLITERAL"] = 122] = "XMLLITERAL";
    TokenType[TokenType["XMLPART"] = 123] = "XMLPART";
    TokenType[TokenType["XMLMARKUP"] = 124] = "XMLMARKUP";
    TokenType[TokenType["XMLTEXT"] = 125] = "XMLTEXT";
    TokenType[TokenType["XMLTAGENDEND"] = 126] = "XMLTAGENDEND";
    TokenType[TokenType["XMLTAGSTARTEND"] = 127] = "XMLTAGSTARTEND";
    TokenType[TokenType["ATTRIBUTEIDENTIFIER"] = 128] = "ATTRIBUTEIDENTIFIER";
    TokenType[TokenType["DOCCOMMENT"] = 129] = "DOCCOMMENT";
    TokenType[TokenType["BLOCKCOMMENT"] = 130] = "BLOCKCOMMENT";
    TokenType[TokenType["SLASHSLASHCOMMENT"] = 131] = "SLASHSLASHCOMMENT";
    TokenType[TokenType["EOL"] = 132] = "EOL";
    TokenType[TokenType["EMPTY"] = 133] = "EMPTY";
    TokenType[TokenType["ERROR"] = 134] = "ERROR";
    TokenType[TokenType["LAST"] = 134] = "LAST";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
exports.tokenClassNames = [
    "<unused index>",
    "end of program",
    "minus",
    "minusminus",
    "not",
    "notequals",
    "strictnotequals",
    "modulus",
    "modulusassign",
    "bitwiseand",
    "logicaland",
    "logicalandassign",
    "bitwiseandassign",
    "leftparen",
    "rightparen",
    "mult",
    "multassign",
    "comma",
    "dot",
    "doubledot",
    "tripledot",
    "dotlessthan",
    "div",
    "divassign",
    "colon",
    "doublecolon",
    "semicolon",
    "questionmark",
    "atsign",
    "leftbracket",
    "rightbracket",
    "bitwisexor",
    "logicalxor",
    "logicalxorassign",
    "bitwisexorassign",
    "leftbrace",
    "bitwiseor",
    "logicalor",
    "logicalorassign",
    "bitwiseorassign",
    "rightbrace",
    "bitwisenot",
    "plus",
    "plusplus",
    "plusassign",
    "lessthan",
    "leftshift",
    "leftshiftassign",
    "lessthanorequals",
    "assign",
    "minusassign",
    "equals",
    "strictequals",
    "greaterthan",
    "greaterthanorequals",
    "rightshift",
    "rightshiftassign",
    "unsignedrightshift",
    "unsignedrightshiftassign",
    "abstract",
    "as",
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "enum",
    "extends",
    "false",
    "final",
    "finally",
    "for",
    "function",
    "get",
    "goto",
    "if",
    "implements",
    "import",
    "in",
    "include",
    "instanceof",
    "interface",
    "is",
    "namespace",
    "config",
    "native",
    "new",
    "null",
    "package",
    "private",
    "protected",
    "public",
    "return",
    "set",
    "static",
    "super",
    "switch",
    "synchronized",
    "this",
    "throw",
    "throws",
    "transient",
    "true",
    "try",
    "typeof",
    "use",
    "var",
    "void",
    "volatile",
    "while",
    "with",
    "identifier",
    "numberliteral",
    "regexpliteral",
    "stringliteral",
    "negminlongliteral",
    "xmlliteral",
    "xmlpart",
    "xmlmarkup",
    "xmltext",
    "xmltagendend",
    "xmltagstartend",
    "attributeidentifier",
    "docComment",
    "blockComment",
    "slashslashcomment",
    "end of line",
    "<empty>",
    "<error>",
    "abbrev_mode",
    "full_mode"
];
function tokenToString(token, text) {
    return exports.tokenClassNames[token.type] + ' '.repeat(25 - exports.tokenClassNames[token.type].length) +
        ' '.repeat(6 - String(token.start).length) + String(token.start) +
        ' |' + text.slice(token.start, token.start + token.length) + '|';
}
exports.tokenToString = tokenToString;
