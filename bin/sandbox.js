"use strict";
function runCommand(cmd) {
    let stringStarted = false;
    let arr = [];
    let buff = '';
    for (let str of cmd.split(' ')) {
        console.log(str, stringStarted, buff);
        if (str.startsWith('"') && !stringStarted) {
            stringStarted = true;
            str = str.slice(1);
            buff = '';
        }
        if (str.endsWith('"') && stringStarted) {
            stringStarted = false;
            str = buff + (buff === '' ? '' : ' ') + str.slice(0, str.length - 1);
        }
        if (stringStarted)
            buff += (buff === '' ? '' : ' ') + str;
        else
            arr.push(str);
    }
    return arr.map(a => a.replace("''", '"').replace("'\\\\'", "'\\'").replace('\\\\', '\\'));
}
console.log(runCommand('hello i "am\'\' Eloy" and "i am" "13 years old"'));
