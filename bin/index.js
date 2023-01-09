"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//Imports
const path_1 = require("path");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const websocket_1 = require("websocket");
const messageBuilder_1 = require("./messageBuilder");
const sequelize_1 = require("./db/sequelize");
const bcryptjs_1 = require("bcryptjs");
//Configuration file import
const config = require('../config.json');
//Create HTTP server
const PORT = process.env.PORT || 3000;
const app = (0, express_1.default)();
const server = require('http').Server(app);
//Add express middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static((0, path_1.join)(__dirname, '../public')));
//Create WebSocket server
const ws = new websocket_1.server({
    httpServer: server,
    autoAcceptConnections: false
});
//Initialize Database
(0, sequelize_1.initDB)();
//WebSocket events
ws.on('request', req => {
    var conn = req.accept(null, req.origin);
    //Login
    conn.send((0, messageBuilder_1.message)('login', ''));
    conn.once('message', msg => {
        let content = (msg.type === 'binary' ? msg.binaryData.toString() : msg.utf8Data).split('&&').map((c) => c.replace('&\\&', '&&'));
        let username = content[0];
        let password = content[1];
        if (!username || !password) {
            (0, messageBuilder_1.error)(conn, 'Username and password must be provided ("username&&password").');
            conn.close();
        }
        sequelize_1.Player.findOne({
            where: {
                username
            }
        }).then(player => {
            if (!player || player.getDataValue('password') !== (0, bcryptjs_1.hashSync)(password, 10)) {
                (0, messageBuilder_1.error)(conn, 'Invalid username or password.', username, password);
                conn.close();
            }
            (0, messageBuilder_1.resp)(conn, config.welcomeMessage.replace('$$', username).replace('$\\$', '$$'));
            conn.on('message', msg => {
                console.log(conn.data);
                //env.reqMan.run(conn, (msg.type === 'utf8') ? msg.utf8Data : msg.binaryData.toString());
                //console.log('Message received: ' + msg.utf8Data);
                //connection.sendUTF('Message received: ' + msg.utf8Data);
            });
        });
    });
    conn.on('close', (code, desc) => {
        console.log('Player disconnected: ' + code + ' ' + desc);
    });
});
//Run command function
function runCommand(cmd) {
    let splitted = cmd.split(' ');
    let stringStarted = false;
    let formatted = [];
    let buff = '';
    for (let str of splitted) {
        if (str.startsWith('"') && !stringStarted) {
            stringStarted = true;
            str = str.slice(1);
        }
        if (str.endsWith('"') && stringStarted) {
            stringStarted = false;
            str = "";
        }
        if (stringStarted)
            buff += str;
        else
            formatted.push(str);
    }
}
server.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
