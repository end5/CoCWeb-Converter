Stages of the transpiler
1. Convert - Using regular expressions, convert AS3 to valid TS syntax
2. Unwrap - Using TS Compiler API, unwrap classes
    1. Rename method that has same name as class to "constructor"
    2. ! Remove empty methods or constructors
    3. Unwrap methods to functions
3. Fix - Using ts-morph, fix any issues
    1. Remove empty methods or constructors
    2. Add missing parameters to methods and functions
    3. Remove empty classes
    4. Format and add missing imports

! - Needs to be implemented