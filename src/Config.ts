
export interface ParameterStruct {
    name: string;
    type: string;
}

export interface TransformConfig {
    /** Remove these extensions from all classes */
    removeExtends: string[];
    /** Ignore the "transform method to function" step in these classes */
    ignoreClasses: string[];
    /** Ignore the "transform method to function" step on specified methods originating from classes that implement the these interfaces */
    ignoreInterfaceMethods: Record<string, string[]>;
    /** If the function or method body has these identities, add them to function or method paramters */
    identiferToParamPairs: ParameterStruct[];
}
