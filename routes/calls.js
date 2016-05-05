'use strict';

// Tasks routes
var Joi = require('joi');
var CallsController = require('../controllers/Calls');
var Hapi = require('hapi');


exports.register = function(server, options, next) {
    // Setup the controller
    var callsController = new CallsController(options.database);

    server.bind(callsController);

    // Declare routes
    server.route([
        {
            method: 'POST',
            path: '/calls/new/{id}',
            config: {
                handler: callsController.newCall,
                validate: {
                    params: {
                        id: Joi.string().regex(/[0-9]+/)
                    },
                    payload: {
                        callerid: Joi.number().required(),
                        timestamp: Joi.string().regex(/[A-Z0-9]{1,}/).required()
                    }
                }
            }
        }
    ]);

    next();
}

exports.register.attributes = {
    name: 'routes-calls',
    version: '1.0.1'
};
