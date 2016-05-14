'use strict';

// Tasks routes
var Joi = require('joi');
var SwitchboardsController = require('../controllers/Switchboards');

exports.register = function(server, options, next) {
    // Setup the controller
    var switchController = new SwitchboardsController(options.database);

    // Binds all methods
    // similar to doing `tasksController.index.bind(tasksController);`
    // when declaring handlers
    server.bind(switchController);

    // Declare routes
    server.route([
        {
            method: 'GET',
            path: '/switchboards/{id}',
            config: {
                handler: switchController.regenerateDialplan,
                validate: {
                    params: {
                        id: Joi.string().regex(/[0-9]+/)
                    }
                }
            }
        },
        {
            method: 'GET',
            path: '/switchboards/exists/{id}',
            config: {
                handler: switchController.exists,
                validate: {
                    params: {
                        id: Joi.string().regex(/[0-9]+/)
                    }
                }
            }
        }
    ]);

    next();
}

exports.register.attributes = {
    name: 'routes-switchboards',
    version: '1.0.1'
};
