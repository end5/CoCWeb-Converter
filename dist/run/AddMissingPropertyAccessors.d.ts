interface TextChange {
    span: TextSpan;
    newText: string;
}
interface TextSpan {
    start: number;
    length: number;
}
export declare function addMissingPropertyAccessors(tsConfigFilePath: string): void;
export declare function applyTextChanges(text: string, changes: TextChange[]): string;
export {};
