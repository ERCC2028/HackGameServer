"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const bcryptjs_1 = require("bcryptjs");
const sequelize_1 = require("sequelize");
function isManifest(manifest) {
    if (typeof manifest !== 'object')
        return false;
    if (typeof manifest.name !== 'string')
        return false;
    if (manifest.models !== undefined && !Array.isArray(manifest.models))
        return false;
    return true;
}
function isCommand(cmd) {
    if (typeof cmd !== 'object')
        return false;
    if (typeof cmd.name !== 'string')
        return false;
    if (typeof cmd.description !== 'string')
        return false;
    if (cmd.subcommands !== undefined && !Array.isArray(cmd.subcommands))
        return false;
    if (cmd.subcommands !== undefined)
        for (const subcmd of cmd.subcommands)
            if (!isCommand(subcmd))
                return false;
    if (!Array.isArray(cmd.args))
        return false;
    for (const arg of cmd.args) {
        if (typeof arg !== 'object')
            return false;
        if (typeof arg.name !== 'string')
            return false;
        if (typeof arg.description !== 'string')
            return false;
        if (typeof arg.required !== 'boolean')
            return false;
        if (typeof arg.type !== 'object')
            return false;
        if (typeof arg.type.check !== 'function')
            return false;
        if (typeof arg.type.parse !== 'function')
            return false;
    }
    return true;
}
const defaultModel = {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
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
function loadMods(sequelize) {
    let manifests = loadManifests();
    let ret = { models: {}, commands: [] };
    //Load Models
    manifests.flatMap(manifest => manifest.models).forEach(model => model ? ret.models[model] = loadModel(sequelize, model) : void 0);
    //Load Commands
    ret.commands = loadCommands();
}
exports.default = loadMods;
function loadManifests() {
    let manifests = [];
    (0, fs_1.readdirSync)((0, path_1.join)(__dirname, './mods')).forEach(mod => {
        if (!(0, fs_1.existsSync)((0, path_1.join)(__dirname, `./mods/${mod}/manifest.json`)))
            throw new Error(`Failed to load mod "${mod}": Missing manifest`);
        let manifest = require(`./mods/${mod}/manifest.json`);
        if (!isManifest(manifest))
            throw new Error(`Failed to load mod "${mod}": Invalid manifest`);
        manifests.push(manifest);
    });
    return manifests;
}
function loadModel(sequelize, modelName) {
    let modFiles = [];
    (0, fs_1.readdirSync)((0, path_1.join)(__dirname, './mods')).forEach(mod => {
        if ((0, fs_1.existsSync)((0, path_1.join)(__dirname, `./mods/${mod}/${modelName.toLowerCase()}.js`)))
            modFiles.push(require(`./mods/${mod}/${modelName.toLowerCase()}`));
    });
    let model = {};
    modFiles.forEach(load => model = Object.assign(Object.assign({}, model), load(sequelize_1.DataTypes)));
    return sequelize.define(modelName, model, {
        timestamps: true,
        createdAt: 'created',
        updatedAt: 'updated'
    });
}
function loadCommands() {
    let commands = [];
    (0, fs_1.readdirSync)((0, path_1.join)(__dirname, './mods')).forEach(mod => {
        if ((0, fs_1.existsSync)((0, path_1.join)(__dirname, `./mods/${mod}/commands`)) && (0, fs_1.lstatSync)((0, path_1.join)(__dirname, `./mods/${mod}/commands`)).isDirectory())
            (0, fs_1.readdirSync)((0, path_1.join)(__dirname, `./mods/${mod}/commands`)).forEach(cmdPath => {
                let cmd = require(`./mods/${mod}/commands/${cmdPath}`);
                if (!isCommand(cmd))
                    throw new Error(`Failed to load mod "${mod}": Invalid command "${cmdPath}"`);
                commands.push(cmd);
            });
    });
    return commands;
}
