import { Model } from "sequelize";
import { connection } from "websocket";

export default class PlayerConnection extends connection {
    data: Model<any, any> | undefined
}