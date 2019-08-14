
Stages of the transpiler
Each stage is one pass through the text.
Each stage must be completed on all files before the next stage.

1. Convert the code - Each step needs requires a new AST
    1. Convert - Regular Expressions & Lexer - Convert AS3 to valid TS syntax
        Using the custom lexer, perform the following transforms on code tokens
        Note: Lexer cannot handle unmatched quotes in regexp or xml.
        - Remove
            - `package` (also matching braces)
            - `import`
        - Replace with TS equivalent
            - `for each`
                `/^\s*for each\s*\(\s*(var )?([\w\d]+)\s*(?::\s*[\w\d*]+)? in/`
            - `function`, `var`, `class`, `const` (entire declaration)
                `/^\s*(?:override\s+)?(public|protected|private|internal)\s+(static\s+)?(?:override\s+)?(function|var|class|const)/`
        - Replace the former regexp match with the latter string
            - `/:\s*Function/g` -> `: () => void`
            - `/:\s*Boolean/g` -> `: boolean`
            - `/:\s*Number/g` -> `: number`
            - `/:\s*int/g` -> `: number`
            - `/:\s*String/g` -> `: string`
            - `/:\s*void/g` -> `: void`
            - `/:\s*Array/g` -> `: any[]`
            - `/Vector.</g` -> `Vector<`
            - `/ is /g` -> ` instanceof `
            - `/:\*/g` -> `: any`

    2. Unwrap - TS Compiler API - Unwrap classes using the following steps
        1. Remove empty methods
        2. Rename method that has same name as class to "constructor"
        3. Unwrap methods to functions

    3. Unwrap Cleanup - TS Compiler API - Remove empty classes

2. Format and add missing imports - ts-morph

3. Add missing parameters to methods and functions - ts-morph
