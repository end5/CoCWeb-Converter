let logEnabled = false;

export function enableLog() {
    logEnabled = true;
}

export function disableLog() {
    logEnabled = false;
}

export function log(message: any) {
    if (logEnabled)
        console.log(message + '');
}
