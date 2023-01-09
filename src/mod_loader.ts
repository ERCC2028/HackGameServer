import { readdirSync, existsSync, lstatSync } from 'fs';
import { join } from 'path';
import { hashSync } from 'bcryptjs';
import { ModelAttributes, Sequelize, DataTypes, Model, ModelStatic } from 'sequelize';
import { connection } from 'websocket';

export type Manifest = {
    name: string;
    models?: string[];
}

function isManifest(manifest: any): manifest is Manifest {
    if (typeof manifest !== 'object') return false
    if (typeof manifest.name !== 'string') return false
    if (manifest.models !== undefined && !Array.isArray(manifest.models)) return false
    return true;
}


export type Command = {
    name: string;
    description: string;
    subcommands?: Command[];
    args: {
        name: string;
        description: string;
        required: boolean;
        isArray: boolean
        type: {
            name: string;
            check(str: string): boolean;
            parse(str: string): any;
        };
    }[];
    run(models: ModelStatic<Model<any, any>>, connection: connection, args: any): void
}

function isCommand(cmd: any): cmd is Command {
    if (typeof cmd !== 'object') return false
    if (typeof cmd.name !== 'string') return false
    if (typeof cmd.description !== 'string') return false
    if (cmd.subcommands !== undefined && !Array.isArray(cmd.subcommands)) return false
    if (cmd.subcommands !== undefined) for (const subcmd of cmd.subcommands) if (!isCommand(subcmd)) return false
    if (!Array.isArray(cmd.args)) return false
    for (const arg of cmd.args) {
        if (typeof arg !== 'object') return false
        if (typeof arg.name !== 'string') return false
        if (typeof arg.description !== 'string') return false
        if (typeof arg.required !== 'boolean') return false
        if (typeof arg.isArray !== 'boolean') return false
        if (typeof arg.type !== 'object') return false
        if (typeof arg.type.name !== 'string') return false
        if (typeof arg.type.check !== 'function') return false
        if (typeof arg.type.parse !== 'function') return false
    }
    if (typeof cmd.run !== 'function') return false
    return true;
}

const defaultModel: ModelAttributes = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(32),
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
        type: DataTypes.STRING(64),
        allowNull: false,
        set(password: string) {
            this.setDataValue('password', hashSync(password, 10));
        },
        validate: {
            notNull: { msg: 'The player password is a required property.' }
        }
    },
    money: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: [0],
                msg: 'The player money must be a positive number.'
            }
        }
    }
}

var oldLoadModels: { [x: string]: ModelStatic<Model<any, any>> } | undefined

export default function loadModels(sequelize: Sequelize) {
    if (oldLoadModels) return oldLoadModels

    let manifests = loadManifests();
    let models: { [x: string]: ModelStatic<Model<any, any>> } = {}

    //Load Models
    manifests.flatMap(manifest => manifest.models).forEach(model => model ? models[model] = loadModel(sequelize, model) : void 0);

    console.log('Models loaded successfully !')
    oldLoadModels = models
    return models
}

function loadManifests() {
    let manifests: Manifest[] = [];
    readdirSync(join(__dirname, './mods')).forEach(mod => {
        if (!existsSync(join(__dirname, `./mods/${mod}/manifest.json`))) throw new Error(`Failed to load mod "${mod}": Missing manifest`)
        let manifest = require(`./mods/${mod}/manifest.json`)
        if (!isManifest(manifest)) throw new Error(`Failed to load mod "${mod}": Invalid manifest`)
        manifests.push(manifest);
    });
    return manifests;
}

function loadModel(sequelize: Sequelize, modelName: string) {

    let modFiles: ((DataTypes: typeof import('sequelize/types/data-types')) => ModelAttributes)[] = [];

    readdirSync(join(__dirname, './mods')).forEach(mod => {
        if (existsSync(join(__dirname, `./mods/${mod}/${modelName.toLowerCase()}.js`)))
            modFiles.push(require(`./mods/${mod}/${modelName.toLowerCase()}`));
    });

    let model: ModelAttributes = {};

    modFiles.forEach(load => model = { ...model, ...load(DataTypes) });

    return sequelize.define(modelName, model, {
        timestamps: true,
        createdAt: 'created',
        updatedAt: 'updated'
    });
}

var oldLoadCommands: Command[] | undefined
export function loadCommands() {
    if (oldLoadCommands) return oldLoadCommands

    let commands: Command[] = [];
    readdirSync(join(__dirname, './mods')).forEach(mod => {
        if (existsSync(join(__dirname, `./mods/${mod}/commands`)) && lstatSync(join(__dirname, `./mods/${mod}/commands`)).isDirectory())
            readdirSync(join(__dirname, `./mods/${mod}/commands`)).forEach(cmdPath => {
                let cmd = require(`./mods/${mod}/commands/${cmdPath}`)
                if (!isCommand(cmd)) throw new Error(`Failed to load mod "${mod}": Invalid command "${cmdPath}"`)
                commands.push(cmd)
            });
    });
    oldLoadCommands = commands
    return commands;
}