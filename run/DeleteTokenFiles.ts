import { existsSync, lstatSync, unlinkSync } from "fs";
import { walk } from "../src/Walk";

const fileOrDir = process.argv[2];

let fileList = [fileOrDir];
if (existsSync(fileOrDir) && lstatSync(fileOrDir).isDirectory())
    fileList = walk(fileOrDir).filter((file) => file.endsWith('.tkns'));

for (const file of fileList) {
    console.log('Deleting "' + file + '"');

    unlinkSync(file);
}
