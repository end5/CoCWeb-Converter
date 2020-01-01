"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AddMissingPropertyAccessors_1 = require("./AddMissingPropertyAccessors");
const AddMissingSuper_1 = require("./AddMissingSuper");
const AddPackageAndClass_1 = require("./AddPackageAndClass");
const ChangeExtension_1 = require("./ChangeExtension");
const DeleteTokenFiles_1 = require("./DeleteTokenFiles");
const RemoveSetterReturnType_1 = require("./RemoveSetterReturnType");
const cmd = process.argv[2];
const fileOrDir = process.argv[3];
const rootPath = process.argv[4];
const funcs = {
    addmissingpropertyaccessors: AddMissingPropertyAccessors_1.addMissingPropertyAccessors,
    addmissingsuper: AddMissingSuper_1.addMissingSuper,
    addpackageandclass: AddPackageAndClass_1.addPackageAndClass,
    changeextension: ChangeExtension_1.changeExtension,
    deletetokenfils: DeleteTokenFiles_1.deleteTokenFiles,
    removesetterreturntype: RemoveSetterReturnType_1.removeSetterReturnType,
};
const cmdLower = cmd.toLowerCase();
if (cmdLower in funcs) {
    funcs[cmdLower](fileOrDir, rootPath);
}
else if (cmdLower === 'h' || cmdLower === 'help') {
    console.log('help                          Displays this menu');
    console.log(' - Displays this menu');
    console.log('addMissingPropertyAccessors <path to tsconfig.json>');
    console.log(' - Adds missing property accessors (this.)');
    console.log('addMissingSuper <path to tsconfig.json>');
    console.log(' - Adds missing "super" calls in constructors');
    console.log('addPackageAndClass <file or directory> <root directory>');
    console.log(' - Adds "package" and "class" with matching brackets');
    console.log('changeExtension <file or directory>');
    console.log(' - Changes the file extension from ".as" to ".ts"');
    console.log('deleteTokenFiles <file or directory>');
    console.log(' - Deletes ".tkns" files');
    console.log('removeSetterReturnType <file or directory>');
    console.log(' - Removes setter return type');
}
else {
    console.log('Unknown command ' + cmd);
}
