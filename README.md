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

#### Converting Steps
1. Add 'package' and 'class' to any files that are loaded via 'include'
 - `ts-node run/AddPackageAndClass.ts <file or directory> <root path>`
2. Generate token files
 - `java -cp tokenizer/external/*;tokenizer/bin; app.App <file or directory>`
3. Convert code
 - `ts-node run/Convert.ts <file or directory>`
4. Change extensions from '.as' to '.ts'
 - `ts-node run/ChangeExtension.ts <file or directory>`
5. Fix all lexical problems - Any missed problems will cause errors in any later steps
6. Format and add missing imports
 - `ts-node run/FormatAndImport.ts <tsconfig file>`
7. Lint and fix fixable problems
 - `node node_modules/tslint/bin/tslint --fix -c <tslint file> -p <tsconfig file>`
8. Add missing property accessors ('this.') - Can be skipped if the linter fixes this
 - `ts-node run/AddMissingPropertyAccessors.ts <tsconfig file>`
9. Add missing 'super' to constructors - Can be skipped if the linter fixes this
 - `ts-node run/AddMissingSuper.ts <tsconfig file>`
10. Remove setter return types
 - `ts-node run/RemoveSetterReturnType.ts <tsconfig file>`

#### Things the transpiler does
Out of date
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
