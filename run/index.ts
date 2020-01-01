import { addMissingPropertyAccessors } from "./AddMissingPropertyAccessors";
import { addMissingSuper } from "./AddMissingSuper";
import { addPackageAndClass } from "./AddPackageAndClass";
import { changeExtension } from "./ChangeExtension";
import { deleteTokenFiles } from "./DeleteTokenFiles";
import { removeSetterReturnType } from "./RemoveSetterReturnType";

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
};

const cmdLower = cmd.toLowerCase();

if (cmdLower in funcs) {
    funcs[cmdLower as keyof typeof funcs](fileOrDir, rootPath);
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
