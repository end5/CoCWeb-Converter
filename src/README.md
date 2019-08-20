
Stages of the transpiler
Each stage is one pass through the text.
Each stage must be completed on all files before the next stage.

1. Convert the code - Each step needs requires a new AST
    1. Convert - Adobe Flex Scanner - Convert AS3 to valid TS syntax
        - Remove
            - `package` (including matching braces)
        - Comment
            - `import`
            - `include`
        - Replace with TS equivalent
            - `for each ( var <1> : <2> in`
                - Remove `each`, `:`, `<2>`
                - `var` -> `const`
                - `in` -> `of`
            - `override (public | protected | private | internal) static override (function | var | class | const)`
                - Remove `override`
                - `class`
                    - `public`, `internal` -> `export`
                    - Remove `protected`, `private`
                - `function`, `var`, `const`
                    - Convert to function
                        - `public`, `internal` -> `export`
                        - Remove `protected`, `private`, `static`
                    - Inside class
                        - `internal` -> `public`
                        - Remove `function`, `var`, `const`
            - `: Function` -> `: () => void`
            - `: Boolean` -> `: boolean`
            - `: Number` -> `: number`
            - `: int` -> `: number`
            - `: String` -> `: string`
            - `: void` -> `: void`
            - `: Array` -> `: any[]`
            - `: *` -> `: any`
            - `Vector.<` -> `Vector<`
            - `is` -> ` instanceof `

    2. Unwrap - TS Compiler API - Unwrap classes using the following steps
        1. Remove empty methods
        2. Rename method that has same name as class to "constructor"
        3. Unwrap methods to functions

    3. Unwrap Cleanup - TS Compiler API - Remove empty classes

2. Format and add missing imports - ts-morph

3. Add missing parameters to methods and functions - ts-morph
