'use strict';

// Tasks routes
var Joi = require('joi');
var DialplanController = require('../controllers/Dialplans');

exports.register = function(server, options, next) {
    // Setup the controller
    var dialplanController = new DialplanController(options.database);

    // Binds all methods
    // similar to doing `tasksController.index.bind(tasksController);`
    // when declaring handlers
    server.bind(dialplanController);

    // Declare routes
    server.route([
        {
            method: 'GET',
            path: '/dialplan/{sid}/module/exists/{mid}',
            config: {
                handler: dialplanController.exists,
                validate: {
                    params: {
                        mid: Joi.string().regex(/[0-9]+/),
                        sid: Joi.string().regex(/[0-9]+/)
                    }
                }
            }
        },
        {
            method: 'POST',
            path: '/dialplan/{sid}/module/updateFile/{mid}',
            config: {
                handler: dialplanController.exists,
                validate: {
                    params: {
                        mid: Joi.string().regex(/[0-9]+/),
                        sid: Joi.string().regex(/[0-9]+/)
                    },
                    payload: {
                        file: Joi.string().required()
                    }
                }
            }
        }
    ]);

    next();
}

exports.register.attributes = {
    name: 'routes-dialplans',
    version: '1.0.1'
};
