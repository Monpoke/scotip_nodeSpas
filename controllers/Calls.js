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

var Boom = require('boom');
var CallsDAO = require('../dao/CallsDAO');
var ModuleDAO = require('../dao/ModuleDAO');
var SwitchboardDAO = require('../dao/SwitchboardDAO');


function CallsController(database) {
};

// [GET] /calls/new/{id}
CallsController.prototype.newCall = function (request, reply) {

    try {
        var id = request.params.id * 1;
        var controller = this;
        SwitchboardDAO.find(id, function (err, rows) {
            if (err) {
                reply(Boom.notFound(err));
            }
            else if (rows.length == 0) {
                reply(Boom.notFound("switchboard don't exists"))
            }
            else {
                controller.checkParams(request, reply);
            }
        });


    } catch (e) {
        reply(Boom.notFound(e.message));
    }

};

// [POST] /calls/end/{id}
CallsController.prototype.endCall = function (request, reply) {
    CallsDAO.find(request.params.id, function (err, rows) {
        if (err) throw err;

        if (rows.length == 0) {
            reply(Boom.notFound("call not exists"));
            return;
        }

        var call = rows[0];
        var date = new Date(call.timestamp);

        var now = new Date();
        var totalTime = parseInt((now.getTime() - date.getTime()) / 1000);


        var data = {
            duration: totalTime
        }

        CallsDAO.endCall(request.params.id, data, function (err, ro) {
            if (err) throw err;
            console.log("Ending call " + request.params.id);
            reply("ok");
        });

    });


}

// [POST] /calls/action/{id}
CallsController.prototype.recordAction = function (request, reply) {
    CallsDAO.find(request.params.id, function (err, rows) {
        if (err) throw err;

        if (rows.length == 0) {
            reply(Boom.notFound("call not exists"));
            return;
        }

        var call = rows[0];

        ModuleDAO.getModuleType(request.payload.mod, function (moduleType) {

            var s = "User entered the module: #" + request.payload.mod + "[" + moduleType.slug + "]";
            if (moduleType.phoneKeyDisabled.readInt8() == 0) {
                s += " by pressing key <i>" + moduleType.phone_key + "</i>";
            }

            var data = {
                action: s
            }

            CallsDAO.saveAction(request.params.id, data, function (err, ro) {
                if (err) throw err;
                console.log("Saving action " + request.params.id);
                reply("ok");
            });
        });


    });


}

// [POST] /calls/variable/{id}
CallsController.prototype.recordVariable = function (request, reply) {
    CallsDAO.find(request.params.id, function (err, rows) {
        if (err) throw err;

        if (rows.length == 0) {
            reply(Boom.notFound("call not exists"));
            return;
        }

        var call = rows[0];

        var data = {
            varname: request.payload.varname,
            value: request.payload.value
        }

        CallsDAO.saveVariable(request.params.id, data, function (err, ro) {
            if (err) throw err;
            console.log("Saving variable " + request.params.id);
            reply("ok");
        });
    });


}


CallsController.prototype.checkParams = function checksParams(request, reply) {

    var call = {
        callerid: request.payload.callerid,
        timestamp: new Date()
    };


    CallsDAO.registerNewCall(request.params.id, call, function (id) {
        console.log("Returning ID: " + id);
        reply(id);
    });


};


module.exports = CallsController;
