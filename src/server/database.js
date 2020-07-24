const pgp = require('pg-promise')();
const fs = require('fs').promises;
const CsvReader = require('promised-csv');
let db;

// Used to connect to the Heroku Postgres database
const connect = () => {
    db = pgp({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
};

// Used to disconnect from the Heroku Postgres database.
const disconnect = () => {
    db.$pool.end();
};

// Return a Promise that returns all folders in the "./data" directory.
const getDataFolders = () => {
    return fs.readdir('./data');
};

// Return a Promise that drops a given database table.
const dropTable = (table) => {
    console.log(`- Dropping table: ${table}`);
    return db.any(`DROP TABLE IF EXISTS ${table}`).catch((error) => {
        console.log('ERROR:', error);
    });
};

// Return a Promise reads the "create.sql" file from a given data folder then uses the contents to create a table
const createTable = async (folder) => {
    console.log(`- Creating table: ${folder}`);
    return db.any(await fs.readFile(`./data/${folder}/create.sql`, 'utf-8'));
};

// Return a Promise to insert a CSV parsed row for a given database table
const insertRow = (table, columns, values) => {
    return db.any('INSERT INTO $1:name($2:name) VALUES ($3:list)', [
        table,
        columns,
        values
    ]);
};

// Return a Promise to the data.csv file for a given folder, then import the data into a database table
const importData = async (folder) => {
    console.log(`- Importing data: ${folder}`);
    let columns;

    await Promise.all(
        await new CsvReader(true).read(`./data/${folder}/data.csv`, (row) => {
            if (columns) {
                return insertRow(folder, columns, row);
            }
            columns = row;
            return null;
        })
    );
    return true;
};

const resetTable = async (folder) => {
    await dropTable(folder);
    await createTable(folder);
    return importData(folder);
};

// Return a Promise to cycle through each folder in ./data, and reset it.
const resetDatabaseTables = async () => {
    console.log('Resetting Database Tables');
    return Promise.all(
        (await fs.readdir('data')).map(async (folder) => resetTable(folder))
    );
};

// Return a Promise to check whether a database table exists.
const doesTableExist = async (table) => {
    return (
        await db.any(
            'SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2)',
            ['public', table]
        )
    )[0].exists;
};

// Checks see if ANY of the database tables already exist (true if any exist, false if none exist)
const DoDatabaseTablesExist = async () => {
    connect();
    const statuses = await Promise.all(
        (await getDataFolders()).map((table) => doesTableExist(table))
    );
    disconnect();
    return statuses.some((status) => status);
};

// Gets a list of all the demo data sources (basically all the folders in ./data)
const GetDatabaseTables = async () => {
    const folders = await getDataFolders();
    console.log(folders);
    return folders;
};

// Resets all the demo data (deletes the tables, then recreates and repopulates them)
const ResetDatabaseTables = async () => {
    connect();
    const status = await resetDatabaseTables();
    console.log('Reset Database Tables Complete');
    disconnect();
    return status;
};

module.exports = {
    GetDatabaseTables,
    ResetDatabaseTables,
    DoDatabaseTablesExist
};
