import { spawnSync } from "child_process";

const fileOrDir = process.argv[2];

const child = spawnSync(
    'java', ['-cp', 'tokenizer/external/*;tokenizer/bin;', 'app.App', fileOrDir]
);

if (child.stderr)
    console.error(child.stderr.toString());
