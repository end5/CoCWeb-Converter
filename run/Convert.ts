import { existsSync, lstatSync, writeFile } from "fs";
import { walk } from "../src/Walk";
import { Converter } from "../src/Convert";

// Command line arg for file or directory to start
const fileOrDir = process.argv[2];

let fileList = [fileOrDir];
if (existsSync(fileOrDir) && lstatSync(fileOrDir).isDirectory())
    fileList = walk(fileOrDir).filter((file) => file.endsWith('.as'));

for (const file of fileList) {
    console.log('Converting "' + file + '"');

    let newText = new Converter(file).convert();

    writeFile(file, newText, (err) => { if (err) console.log(err) });
}
