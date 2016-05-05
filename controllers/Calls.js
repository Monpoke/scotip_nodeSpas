'use strict';

var Boom = require('boom');
var CallsDAO = require('../dao/CallsDAO');
var SwitchboardDAO = require('../dao/SwitchboardDAO');


function CallsController(database) {
};

// [GET] /switchboards/{id}
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

CallsController.prototype.checkParams = function checksParams(request, reply) {

    var call = {
        callerid: request.payload.callerid,
        timestamp: request.payload.timestamp
    };


    CallsDAO.registerNewCall(request.params.id, call, function (id) {
        console.log("Returning ID: " + id);
        reply(id);
    });


};


module.exports = CallsController;
