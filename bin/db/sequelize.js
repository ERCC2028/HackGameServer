"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDB = exports.Player = exports.sequelize = void 0;
//Sequelize imports
const sequelize_1 = require("sequelize");
//Loaders imports
const player_1 = __importDefault(require("../models/player"));
//Import configuration file from ../../config.json
const config = require('../../config.json');
//Create database connection 'mysql://x1WeLlUo21:LnKIk39RqG@remotemysql.com:3306/x1WeLlUo21'
exports.sequelize = (process.env.NODE_ENV === 'production') ? new sequelize_1.Sequelize(config.database.production) : new sequelize_1.Sequelize(config.database.development);
//Load Sequelize Models
exports.Player = (0, player_1.default)(exports.sequelize);
//Init database
function initDB() {
    //Autenticate Sequelize connection
    exports.sequelize.authenticate()
        .catch(console.error);
    //Push Sequelize Models to database
    exports.sequelize.sync({ force: process.env.NODE_ENV !== 'production' })
        .then(_ => {
        console.log('Database initialized.');
        exports.Player.count()
            .then(count => {
            console.log(count);
            if (count === 0)
                require('./mock_players').players.forEach((user) => exports.Player.create(user));
        });
    });
}
exports.initDB = initDB;
