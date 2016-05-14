'use strict';

var Database = require('./database');
var Hapi = require('hapi');

var database = new Database();
var server = new Hapi.Server({debug: {request: ['info', 'error']}});

// Expose database
if (process.env.NODE_ENV === 'test') {
    server.database = database;
}

// Create server
server.connection({
    host: 'localhost',
    port: 8000
});

// Add routes
var plugins = [
    {
        register: require('./routes/switchboards.js'),
        options: {
            database: database
        }
    },
    {
        register: require('./routes/calls.js'),
        options: {
            database: database
        }
    },
    {
        register: require('./routes/dialplans.js'),
        options: {
            database: database
        }
    }

];

server.register(plugins, function (err) {
    if (err) { throw err; }

    if (!module.parent) {
        server.start(function(err) {
            if (err) { throw err; }

            server.log('info', 'Server running at: ' + server.info.uri);
            console.log('Server running at: '+ server.info.uri);

            if(process.env.PROD_SERVER == 1){
                console.log("PRODUCTION SERVER");
            } else {
                console.log("Dev server");
            }
        });
    }
});

module.exports = server;
