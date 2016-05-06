'use strict';

// Tasks routes
var Joi = require('joi');
var CallsController = require('../controllers/Calls');


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
                        callerid: Joi.string().regex(/[0-9]+/).required()
                    }
                }
            }
        },
        {
            method: 'POST',
            path: '/calls/end/{id}',
            config: {
                handler: callsController.endCall,
                validate: {
                    params: {
                        id: Joi.string().regex(/[0-9]+/)
                    },
                    payload: {
                        //callerid: Joi.string().regex(/[0-9]+/).required()
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
