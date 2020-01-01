/**
 * Converts the text from AS3 to TS.
 * Removes 'package', 'import' and 'use'.
 * Converts types.
 * Anything found outside a class is converted to standalone
 * @param source File path
 */
export declare class Converter {
    private scanner;
    private changes;
    private state;
    constructor(source: string);
    convert(): string;
    private getScope;
    private programScope;
    private packageScope;
    private interfaceScope;
    private classScope;
    private functionScope;
    private replaceType;
    private removeIdentifierChain;
    private declarationInPackage;
    private declarationInClass;
    private commentToken;
}
