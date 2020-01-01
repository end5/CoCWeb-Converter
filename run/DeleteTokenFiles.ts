import { existsSync, lstatSync, unlinkSync } from "fs";
import { walk } from "../src/Walk";

export function deleteTokenFiles(fileOrDir: string) {
    let fileList = [fileOrDir];
    if (existsSync(fileOrDir) && lstatSync(fileOrDir).isDirectory())
        fileList = walk(fileOrDir).filter((file) => file.endsWith('.tkns'));

    for (const file of fileList) {
        console.log('Deleting "' + file + '"');

        unlinkSync(file);
    }
}
