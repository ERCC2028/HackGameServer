export default function load(DataTypes: typeof import('sequelize/types/data-types')): import('sequelize').ModelAttributes {
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
    }
}