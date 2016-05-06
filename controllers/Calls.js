'use strict';

var Boom = require('boom');
var CallsDAO = require('../dao/CallsDAO');
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
CallsController.prototype.endCall = function(request, reply){
    CallsDAO.endCall(request.params.id);
    reply("ok");
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
