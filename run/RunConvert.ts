import { writeFileSync, renameSync, existsSync, lstatSync } from "fs";
import { walk } from "../src/Walk";
import { convert } from "../src/Convert";
import { fixConstructor } from "../src/FixConstructor";

const fileOrDir = process.argv[2];

let fileList = [fileOrDir];
if (existsSync(fileOrDir) && lstatSync(fileOrDir).isDirectory())
    fileList = walk(fileOrDir).filter((file) => file.endsWith('.as'));

for (const file of fileList) {
    console.log('Converting "' + file + '"');

    let newText = convert(file);

    newText = fixConstructor(file, newText);

    writeFileSync(file, newText);
    renameSync(file, file.replace('.as', '.ts'));
}
