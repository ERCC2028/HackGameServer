"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const bcryptjs_1 = require("bcryptjs");
const sequelize_1 = require("sequelize");
const defaultModel = {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: sequelize_1.DataTypes.STRING(32),
        allowNull: false,
        unique: {
            msg: 'The player name was already taken.',
            name: ''
        },
        validate: {
            notNull: { msg: 'The player name is a required property.' },
            notEmpty: { msg: 'The player name cannot be empty.' }
        }
    },
    password: {
        type: sequelize_1.DataTypes.STRING(64),
        allowNull: false,
        set(password) {
            this.setDataValue('password', (0, bcryptjs_1.hashSync)(password, 10));
        },
        get() {
            return '(hash of password)';
        },
        validate: {
            notNull: { msg: 'The player password is a required property.' }
        }
    },
    money: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: [0],
                msg: 'The player money must be a positive number.'
            }
        }
    }
};
function loadNetworkModel(sequelize) {
    let modFiles = [];
    (0, fs_1.readdirSync)((0, path_1.join)(__dirname, '../mods')).forEach(mod => {
        if ((0, fs_1.existsSync)((0, path_1.join)(__dirname, `../mods/${mod}/network`)))
            modFiles.push(require(`../mods/${mod}/network`));
    });
    let model = defaultModel;
    modFiles.forEach(load => model = Object.assign(Object.assign({}, model), load(sequelize_1.DataTypes)));
    return sequelize.define('Network', model, {
        timestamps: true,
        createdAt: 'created',
        updatedAt: 'updated'
    });
}
exports.default = loadNetworkModel;
