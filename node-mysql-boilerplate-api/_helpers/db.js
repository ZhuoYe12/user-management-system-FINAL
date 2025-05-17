const config = require('../config.json');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    try {
        // connect to db
        const { host, port, user, password, database } = config.database;
        console.log(`Connecting to database: ${database} on ${host}:${port}`);
        
        const sequelize = new Sequelize(database, user, password, { 
            host, 
            port, 
            dialect: 'postgres',
            logging: console.log,
            define: {
                timestamps: false
            },
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            }
        });

        // Test the connection
        try {
            await sequelize.authenticate();
            console.log('Database connection has been established successfully.');
        } catch (error) {
            console.error('Unable to connect to the database:', error);
            throw error;
        }

        // init models and add them to the exported db object
        console.log('Initializing models...');
        db.Account = require('../accounts/account.model')(sequelize);
        db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
        db.Department = require('../departments/department.model')(sequelize);
        db.Employee = require('../employees/employee.model')(sequelize);
        db.Workflow = require('../workflows/workflow.model')(sequelize);
        db.Request = require('../requests/request.model')(sequelize);
        db.RequestItem = require('../requests/request-item.model')(sequelize);

        // define relationships
        console.log('Setting up model relationships...');

        // Account - RefreshToken relationship
        db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
        db.RefreshToken.belongsTo(db.Account);

        // Department - Employee relationship
        db.Department.hasMany(db.Employee, { 
            foreignKey: 'departmentId',
            onDelete: 'SET NULL'
        });
        db.Employee.belongsTo(db.Department, { 
            foreignKey: 'departmentId'
        });

        // Account - Employee relationship  
        db.Account.hasOne(db.Employee, { 
            foreignKey: 'userId', 
            onDelete: 'CASCADE'
        });
        db.Employee.belongsTo(db.Account, { 
            foreignKey: 'userId'
        });

        // Employee - Workflow relationship
        db.Employee.hasMany(db.Workflow, {
            foreignKey: 'employeeId',
            onDelete: 'CASCADE'
        });
        db.Workflow.belongsTo(db.Employee, {
            foreignKey: 'employeeId'
        });

        // Request relationships
        db.Employee.hasMany(db.Request, {
            foreignKey: 'employeeId',
            onDelete: 'CASCADE'
        });
        db.Request.belongsTo(db.Employee, {
            foreignKey: 'employeeId'
        });

        // Request-Items relationship
        db.Request.hasMany(db.RequestItem, {
            foreignKey: 'requestId',
            onDelete: 'CASCADE'
        });
        db.RequestItem.belongsTo(db.Request, {
            foreignKey: 'requestId'
        });

        // Request-Approver relationship
        db.Account.hasMany(db.Request, {
            foreignKey: 'approverId',
            as: 'ApprovedRequests',
            onDelete: 'SET NULL'
        });
        db.Request.belongsTo(db.Account, {
            foreignKey: 'approverId',
            as: 'Approver'
        });

        // sync all models with database
        console.log('Syncing models with database...');
        await sequelize.sync({ force: false, alter: false });
        console.log('Database sync complete');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}
