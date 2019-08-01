let logType: 'string' | 'console' | 'file' | '' = '';
let logText = '';

export function logToConsole() {
    logType = 'console';
}

export function logToString() {
    logType = 'string';
}

export function getLogText() {
    return logText;
}

export function log(message: any, ...optParams: any[]) {
    if (logType === 'console')
        console.log(message + '', optParams);
    else if (logType === 'string') {
        logText += String(message) + '\n';
    }
    else if (logType === 'file') {

    }
}
