import { writeFileSync, existsSync, lstatSync, readFileSync } from "fs";
import { basename, relative } from "path";
import { walk } from "../src/Walk";

/**
 * Adds 'package' and 'public class' with matching braces to files.
 */

const fileOrDir = process.argv[2]; // directory or file
const rootPath = process.argv[3]; // root of files used for 'package'

let fileList = [fileOrDir];
if (existsSync(fileOrDir) && lstatSync(fileOrDir).isDirectory())
    fileList = walk(fileOrDir).filter((file) => file.endsWith('.as'));

for (const filePath of fileList) {
    console.log('Fixing "' + filePath + '"');

    let text = readFileSync(filePath).toString();
    if (text.charCodeAt(0) === 0xFEFF) {
		text = text.slice(1);
    }
    
    const list = relative(rootPath, filePath).split('\\');
    list.pop();
    const packageText = list.join('.');

    writeFileSync(filePath,
        'package ' + packageText + ' {\n' +
        'public class ' + basename(filePath).substr(0, basename(filePath).length - 3) + ' {\n' +
        text +
        '\n}\n' +
        '\n}\n'
    );
}
