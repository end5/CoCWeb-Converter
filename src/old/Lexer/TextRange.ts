interface TextPosition {
    line: number;
    col: number;
}

export class TextRange {
    public constructor(
        public start: TextPosition = { line: 0, col: 0 },
        public end: TextPosition = { line: 0, col: 0 }
    ) { }

    public toString() {
        return `[${this.start.line}:${this.start.col}|${this.end.line}:${this.end.col}]`;
    }
}
