//Sequelize imports
import { Model, ModelStatic, Sequelize } from 'sequelize';

//Loaders imports
import loadModels from '../mod_loader';

//Import configuration file from ../../config.json
const config = require('../../config.json')

//Create database connection 
export const sequelize: Sequelize = (process.env.NODE_ENV === 'production') ? new Sequelize(config.database.production) : new Sequelize(config.database.development);

//Load Sequelize Models
export const models = loadModels(sequelize)

//Init database
export function initDB() {
    //Autenticate Sequelize connection
    sequelize.authenticate()
        .catch(console.error);
        
    //Push Sequelize Models to database
    sequelize.sync({ force: process.env.NODE_ENV !== 'production' })
        .then(_ => {
            console.log('Database initialized.');
            models.Player.count()
                .then(count => {
                    console.log(count)
                    if(count === 0)
                        require('./mock_players').players.forEach((user: {username: string, password: string, money: number}) => models.Player.create(user));
                });
        });
}