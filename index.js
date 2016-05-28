/*
 * Copyright (c) 2016. Pierre BOURGEOIS
 *
 *  Permission is hereby granted, free of charge, to any person
 *  obtaining a copy of this software and associated documentation
 *  files (the "Software"), to deal in the Software without restriction,
 *  including without limitation the rights to use, copy, modify, merge,
 *  publish, distribute, sublicense, and/or sell copies of the Software, and
 *  to permit persons to whom the Software is furnished to do so, subject
 *  to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

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
    },
    {
        register: require('./routes/operators.js'),
        options: {
            database: database
        }
    },
    {
        register: require('./routes/queues.js'),
        options: {
            database: database
        }
    },
    {
        register: require('./routes/moh.js'),
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
