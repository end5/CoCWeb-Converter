import { addMissingPropertyAccessors } from "./run/AddMissingPropertyAccessors";
import { addMissingSuper } from "./run/AddMissingSuper";
import { addPackageAndClass } from "./run/AddPackageAndClass";
import { changeExtension } from "./run/ChangeExtension";
import { deleteTokenFiles } from "./run/DeleteTokenFiles";
import { removeSetterReturnType } from "./run/RemoveSetterReturnType";
import { generateTokenFiles } from "./run/GenerateTokenFiles";

const cmd = process.argv[2];
const fileOrDir = process.argv[3];
const rootPath = process.argv[4];

const funcs = {
    addmissingpropertyaccessors: addMissingPropertyAccessors,
    addmissingsuper: addMissingSuper,
    addpackageandclass: addPackageAndClass,
    changeextension: changeExtension,
    deletetokenfils: deleteTokenFiles,
    removesetterreturntype: removeSetterReturnType,
    generatetokenfiles: generateTokenFiles,
};

const cmdLower = cmd.toLowerCase();

if (cmdLower in funcs) {
    funcs[cmdLower as keyof typeof funcs](fileOrDir, rootPath);
}
else if (cmdLower === 'h' || cmdLower === 'help') {
    console.log('help');
    console.log(' - Displays this menu');
    console.log('addMissingPropertyAccessors <path to tsconfig.json>');
    console.log(' - Adds missing property accessors (this.)');
    console.log('addMissingSuper <path to tsconfig.json>');
    console.log(' - Adds missing "super" calls in constructors');
    console.log('addPackageAndClass <file or directory> <root directory>');
    console.log(' - Adds "package" and "class" with matching brackets');
    console.log('changeExtension <file or directory>');
    console.log(' - Changes the file extension from ".as" to ".ts"');
    console.log('generateTokenFiles <file or directory>');
    console.log(' - Generates a new file (.tkns) for each file that contains a list of tokens');
    console.log('deleteTokenFiles <file or directory>');
    console.log(' - Deletes ".tkns" files');
    console.log('removeSetterReturnType <file or directory>');
    console.log(' - Removes setter return type');
}
else {
    console.log('Unknown command ' + cmd);
}
