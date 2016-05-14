'use strict';

var Boom = require('boom');
var ModuleDAO = require('../dao/ModuleDAO');


function DialplansController(database) {
};

// [GET] /dialplan/module/exists/{id}
DialplansController.prototype.exists = function (request, reply) {

    try {
        var mid = request.params.mid * 1,
            sid = request.params.sid * 1;
        ModuleDAO.find(mid, sid, function (err, rows) {
            if (err || rows.length == 0) {
                reply("error");
                console.log("module don't exists");
            }
            else {
                reply("exists");
            }
        });


    } catch (e) {
        reply(Boom.notFound(e.message));
    }

};

// [POST] /dialplan/module/updateFile/{id}
DialplansController.prototype.updateFile = function (request, reply) {

    try {
        var mid = request.params.mid * 1,
            sid = request.params.sid * 1;

        var file = request.payload.file;

        ModuleDAO.find(mid, sid, function (err, rows) {
            if (err || rows.length == 0) {
                reply("error");
                console.log("module don't exists");
            }
            else {

                // update file
                ModuleDAO.updateFile(mid, file, function (err, result) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    reply("updated");
                    console.log("updated");
                });

            }
        });


    } catch (e) {
        reply(Boom.notFound(e.message));
    }

};


module.exports = DialplansController;
