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
                        end: Joi.number()
                    }
                }
            }
        },
        {
            method: 'POST',
            path: '/calls/action/{id}',
            config: {
                handler: callsController.recordAction,
                validate: {
                    params: {
                        id: Joi.string().regex(/[0-9]+/)
                    },
                    payload: {
                        mod: Joi.number()
                    }
                }
            }
        },
        {
            method: 'POST',
            path: '/calls/variable/{id}',
            config: {
                handler: callsController.recordVariable,
                validate: {
                    params: {
                        id: Joi.string().regex(/[0-9]+/)
                    },
                    payload: {
                        varname: Joi.string(),
                        value: Joi.number()
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
