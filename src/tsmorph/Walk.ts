import { readdirSync, statSync } from "fs";
import { join } from "path";

export function walk(rootDir: string) {
    return recursiveWalk(rootDir, []);
}

function recursiveWalk(rootDir: string, paths: string[]) {
    const list = readdirSync(rootDir);
    for (const path of list) {
        const dirPath = join(rootDir, path);
        if (statSync(dirPath).isDirectory()) {
            recursiveWalk(dirPath, paths);
        }
        else {
            paths.push(join(rootDir, path));
        }
    }
    return paths;
}
