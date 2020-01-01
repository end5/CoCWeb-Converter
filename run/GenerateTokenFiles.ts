import { spawnSync } from "child_process";


export function generateTokenFiles(fileOrDir: string) {
    const child = spawnSync(
        'java', ['-cp', 'tokenizer/external/*;tokenizer/bin;', 'app.App', fileOrDir]
    );

    if (child.stderr)
        console.error(child.stderr.toString());
}
