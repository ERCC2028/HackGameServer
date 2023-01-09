//Imports
import { join } from 'path';
import express from 'express';
import cors from 'cors';
import { connection, server as WebSocketServer } from 'websocket';
import PlayerConnection from './PlayerConnection';
import { message, error, resp } from './messageBuilder';
import { initDB, models } from './db/sequelize';
import { hashSync } from 'bcryptjs';
import { loadCommands } from './mod_loader';

//Configuration file import
const config = require('../config.json')

//Load Commands
const commands = loadCommands()

//Create HTTP server
const PORT = process.env.PORT || 3000;
const app = express();
const server = require('http').Server(app);

//Add express middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

//Create WebSocket server
const ws = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

//Initialize Database
initDB()

//WebSocket events
ws.on('request', req => {
    var conn = req.accept(null, req.origin) as PlayerConnection;
    //Login
    conn.once('message', msg => {
        let content = (msg.type === 'binary' ? msg.binaryData.toString() : msg.utf8Data).split('&&').map((c: string) => c.replace('&\\&', '&&'))

        let username = content[0];
        let password = content[1];

        if (!username || !password) {
            error(conn, 'Username and password must be provided ("username&&password").');
            conn.close();
        }

        models.Player.findOne({
            where: {
                username
            }
        }).then(player => {

            if (!player || player.getDataValue('password') !== hashSync(password, 10)) {
                error(conn, 'Invalid username or password.', username, password);
                conn.close();
            }
            resp(conn, config.welcomeMessage.replace('$$', username).replace('$\\$', '$$'))

            conn.on('message', msg => {
                console.log(conn.data);

                runCommand(conn, msg.type === 'binary' ? msg.binaryData.toString() : msg.utf8Data)
            });
        })
    })

    conn.on('close', (code, desc) => {
        console.log('Player disconnected: ' + code + ' ' + desc);
    });
});

//Run command function
function runCommand(conn: connection, cmd: string) {
    let stringStarted = false
    let arr = []
    let buff = ''
    for (let str of cmd.split(' ')) {
        console.log(str, stringStarted, buff)
        if (str.startsWith('"') && !stringStarted) {
            stringStarted = true
            str = str.slice(1)
            buff = ''
        }
        if (str.endsWith('"') && stringStarted) {
            stringStarted = false
            str = buff + (buff === '' ? '' : ' ') + str.slice(0, str.length - 1)
        }
        if (stringStarted) buff += (buff === '' ? '' : ' ') + str
        else arr.push(str)
    }
    arr = arr.map(a => a.replace("''", '"').replace("'\\\\'", "'\\'").replace('\\\\', '\\'))

    let name = arr[0]
    let strargs = arr.slice(1)

    let command = commands.filter(cmd => cmd.name = name)[0]
    let usage = `${name} ${command.args.map(arg => `${arg.required ? '<' : '['}${arg.name}:${arg.type.name} ${arg.isArray ? '...' : ''}${arg.required ? '>' : ']'}${command.args.map(arg => `\n${arg.name}: ${arg.description}`)}`).join(' ')}`

    if (command.args.length > strargs.length) return error(conn, `Too many arguments.\n"${name}" usage:\n${usage}`)
    strargs.forEach((strarg, i) => {
        let arg = command.args[i]
        if (arg === undefined && command.args[command.args.length - 1].isArray) arg = command.args[command.args.length - 1]
        else return error(conn, `Too many arguments.\n"${name}" usage:\n${usage}`)
    })
}

server.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});