import { connection } from "websocket";

const types = {
    response: 'r',
    error: 'e',
    prompt: 'p'
};

export function message(type: keyof typeof types, printable: string, ...args: string[]): string {
    return `${types[type]}${printable}${(args.length > 0 ? '&&' + args.join('&&') : '')}`;
}

export function error(conn: connection, msg: string, ...args: string[]) {
    conn.send(message('error', msg, ...args))
}

export function resp(conn: connection, printable: string, ...args: string[]) {
    conn.send(message('response', printable, ...args))
}

export function prompt(conn: connection, printable: string, ...args: string[]) {
    conn.send(message('prompt', printable, ...args))
}