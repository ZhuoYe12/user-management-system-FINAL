const config = require('../config.json');
const { Sequelize } = require('sequelize');

module.exports = db = {};

async function initialize() {
    const { host, port, user, password, database } = config.database;

    const sequelize = new Sequelize(database, user, password, { 
        host, 
        port, 
        dialect: 'mysql',
        logging: false,
        define: { timestamps: false }
    });

    await sequelize.authenticate();

    db.Account = require('../accounts/account.model')(sequelize);
    db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);

    db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account);

    await sequelize.sync({ force: false });
    console.log('Database connected and models synced');
}

initialize()
  .catch(err => {
    console.error('Failed to initialize DB:', err);
  });

module.exports = db;
