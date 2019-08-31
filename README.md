# Corruption of Champions Converter

#### Setup instructions

1. Install JDK
2. Download Adobe Flex SDK
3. Copy "asc.jar" into "tokenizer/external"
4. Download "jackson-core", "jackson-annotations", "jackson-databind" jars from the Jackson JSON library for Java
5. Put them into "tokenizer/external"
6. Create "bin" folder in "tokenizer" if it doesn't exist
7. Install Node.js
8. Open command prompt
9. Type `npm i` to install all deps
10. Type `npm run "compile java"`

#### Running
Converting code
 - `ts-node run/RunConvert.ts <file or directory>`
Format and add missing imports
 - `ts-node run/RunFormatAndImport.ts <file or directory or tsconfig.json>`
Unpack methods to functions
 - `ts-node run/RunUnpackMethods.ts <file or directory>`
Add specified names found in methods and functions as parameters to the definition and all calls
 - `ts-node run/RunFixMissingArgs.ts <file or directory or tsconfig.json> <name1> <type1> <name2> <type2> ...`

#### Things the transpiler does
Convert - Adobe Flex Scanner - Convert AS3 to valid TS syntax. **DOES NOT CATCH EVERYTHING**
- Removes
    - `package` (removes matching braces)
    - `import`
    - `include`
    - `use namespace kGAMECLASS`
- Replace with TS equivalent
    - `for each ( var <1> : <2> in`
        - Remove `each`, `:`, `<2>`
        - `var` -> `const`
        - `in` -> `of`
    - `override (public | protected | private | internal) static override (function | var | class | const | interface)`
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
- Fix Constructor - TS Compiler - Rename Actionscript constructors to `constructor`

Unpack - TS Compiler API - Unpack methods in classes to functions

Cleanup - TS Compiler API - Remove empty classes and methods

Format And Import - ts-morph - Formats code and add missing imports

Fix Missing Args - ts-morph - Add missing parameters to methods and functions
