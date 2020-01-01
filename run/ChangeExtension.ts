import { existsSync, lstatSync, renameSync } from "fs";
import { walk } from "../src/Walk";

const fileOrDir = process.argv[2];

let fileList = [fileOrDir];
if (existsSync(fileOrDir) && lstatSync(fileOrDir).isDirectory())
    fileList = walk(fileOrDir).filter((file) => file.endsWith('.as'));

for (const file of fileList) {
    console.log('Changing extension (.as -> .ts) for "' + file + '"');

    renameSync(file, file.replace('.as', '.ts'));
}
