"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function load(DataTypes) {
    return {
        test__xp: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: {
                    args: [0],
                    msg: 'The player xp must be a positive number.'
                }
            }
        }
    };
}
exports.default = load;
