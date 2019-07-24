import { Project } from "ts-morph";

const project = new Project();
const sourceFile = project.addExistingSourceFile('tests/test2.ts');
console.log(JSON.stringify(sourceFile.getStructure()));

const asdf = {
    statements: [{
        name: "zxcv",
        isExported: false,
        isDefaultExport: false,
        hasDeclareKeyword: false,
        docs: [],
        typeParameters: [],
        extends: [],
        callSignatures: [],
        constructSignatures: [],
        indexSignatures: [],
        methods: [],
        properties: [],
        kind: 17
    },
    {
        decorators: [],
        typeParameters: [],
        docs: [],
        isAbstract: false,
        implements: [],
        name: "qwer",
        isExported: false,
        isDefaultExport: false,
        hasDeclareKeyword: false,
        kind: 1,
        ctors: [],
        methods: [],
        properties: [],
        getAccessors: [],
        setAccessors: []
    },
    {
        decorators: [],
        typeParameters: [],
        docs: [],
        isAbstract: false,
        implements: ["zxcv"],
        name: "asdf",
        isExported: false,
        isDefaultExport: false,
        hasDeclareKeyword: false,
        kind: 1,
        ctors: [{
            statements: ["super();",
                "this.obj = { num: 0 };",
                "this.obj.num = 0;",
                "this.obj[0] = 1;",
                "if (this == null) {\r\n    this.num = 0;\r\n}"],
            parameters: [],
            typeParameters: [],
            docs: [],
            scope: "public",
            kind: 3,
            overloads: []
        }],
        methods: [{
            name: "zxcva",
            statements: ["return 'zxcva';"],
            parameters: [],
            typeParameters: [],
            docs: [],
            isGenerator: false,
            isAsync: false,
            isStatic: false,
            hasQuestionToken: false,
            isAbstract: false,
            decorators: [],
            kind: 23,
            overloads: []
        }],
        properties: [{
            name: "num",
            type: "number",
            hasQuestionToken: false,
            hasExclamationToken: false,
            isReadonly: false,
            docs: [],
            isStatic: false,
            scope: "private",
            isAbstract: false,
            decorators: [],
            kind: 28
        },
        {
            name: "obj",
            type: "{ num: number,         [x: string]: number }",
            hasQuestionToken: false,
            hasExclamationToken: false,
            isReadonly: false,
            docs: [],
            isStatic: false,
            scope: "private",
            isAbstract: false,
            decorators: [],
            kind: 28
        }],
        extends: "qwer",
        getAccessors: [],
        setAccessors: []
    }],
    kind: 33
};
