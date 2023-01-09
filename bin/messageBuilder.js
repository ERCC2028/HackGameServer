"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resp = exports.error = exports.message = void 0;
const types = {
    response: 'r',
    error: 'e',
    prompt: 'p',
    login: 'l'
};
function message(type, printable, ...args) {
    return `${types[type]}${printable}${(args.length > 0 ? '&&' + args.join('&&') : '')}`;
}
exports.message = message;
function error(conn, msg, ...args) {
    conn.send(message('error', msg, ...args));
}
exports.error = error;
function resp(conn, printable, ...args) {
    conn.send(message('response', printable, ...args));
}
exports.resp = resp;
