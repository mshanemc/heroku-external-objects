// Simple Express server setup to serve for local testing/dev API server
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const database = require('./database.js');
const DIST_DIR = './dist';

const app = express();
app.use(helmet());
app.use(compression());

const PORT = process.env.PORT || 3002;

function wrapAsync(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(next);
    };
}

app.get(
    '/api/list',
    wrapAsync(async (req, res) => {
        console.log('Current working directory: ' + __dirname);
        const tables = await database.GetDatabaseTables();
        res.json({ tables: tables });
    })
);

app.get(
    '/api/reset',
    wrapAsync(async (req, res) => {
        const status = await database.ResetDatabaseTables();
        res.json({ status: status });
    })
);

app.get(
    '/api/status',
    wrapAsync(async (req, res) => {
        console.log('Current working directory: ' + __dirname);
        const status = await database.DoDatabaseTablesExist();
        res.json({ status: status });
    })
);
app.use((error, req, res) => {
    console.error(`request failed: ${req.url}`);
    console.error(error);
    return res.json({ error });
});

app.use(express.static(DIST_DIR));

app.use('*', (req, res) => {
    res.sendFile('index.html', { root: DIST_DIR });
});

app.listen(PORT, async () => {
    if ((await database.DoDatabaseTablesExist()) === false) {
        console.log('✅  Initializing database tables.');
        database.ResetDatabaseTables();
    } else {
        console.log('✅  Existing database tables detected.');
    }
    console.log(`✅  API Server started.`);
});
