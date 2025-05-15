import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_PORT, DB_USER, NODE_ENV } from '@/config';
import organizationModel from '@/models/organization.model';


import { Sequelize } from 'sequelize';
async function createDatabaseIfNotExists() {
    // Create a temporary connection to postgres to create database
    const tempSequelize = new Sequelize('postgres', process.env.DB_USER!, process.env.DB_PASSWORD!, {
        dialect: 'postgres',
        host: process.env.DB_HOST!,
        port: Number(process.env.DB_PORT),
        logging: false, // Disable logging for temporary connection
    });

    try {
        // Try to create database if it doesn't exist
        await tempSequelize.query(`CREATE DATABASE ${process.env.DB_DATABASE!}`, { raw: true });
        // console.log(Database ${process.env.DB_DATABASE!} created successfully.);
    } catch (error: any) {
        // Ignore error if database already exists
        console.log(error);
        if (error.message.includes('already exists')) {
            // console.log(Database ${process.env.DB_DATABASE!} already exists.);
        } else {
            throw error;
        }
    } finally {
        await tempSequelize.close();
    }
}

export const sequelize = new Sequelize(DB_DATABASE!, DB_USER!, DB_PASSWORD!, {
    dialect: 'postgres',
    host: DB_HOST!,
    port: Number(DB_PORT),
    timezone: '+05:30',
    define: {
        underscored: true,
        freezeTableName: true,
    },
    pool: {
        min: 0,
        max: 5,
    },
    logQueryParameters: NODE_ENV === 'development',
    logging: (query, time) => {
        // console.log(${time}ms ${query});
    },
    benchmark: true,
});

// sequelize
//  .authenticate()
//  .then(() => {
//      console.log('Database connection established successfully.');
//  })
//  .catch(error => {
//      logger.error('Unable to connect to the database:', error);
//  });

export const DB = {
  OrganizationModel :organizationModel(sequelize),
   
    sequelize,
    Sequelize,
};

async function initializeDatabase() {
    try {
        // First ensure database exists
        // await createDatabaseIfNotExists();
        // Then connect to the database
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Sync all models with the database
        await sequelize.sync({ alter: true });
        console.log('Database models synchronized successfully.');
    } catch (error) {
        console.error('Unable to connect to or sync the database:', error);
        throw error;
    }
}

// Initialize database on import
initializeDatabase().catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
});

export { initializeDatabase };
