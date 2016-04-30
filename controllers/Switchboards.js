'use strict';

var Boom = require('boom');
var SwitchboardDAO = require('../dao/SwitchboardDAO');

var DialplanReloader = require('../tools/DialplanReloader');

function SwitchboardsController(database) {
    //this.switchboardDAO = new SwitchboardDAO();
};

// [GET] /switchboards/{id}
SwitchboardsController.prototype.regenerateDialplan = function(request, reply) {
    try {
        var id = request.params.id * 1;

        SwitchboardDAO.find(id, function(err, rows){
            if(err){
                reply(Boom.notFound(err));
            }
            else if(rows.length == 0){
                reply(Boom.notFound("switchboard don't exists"))
            }
            else {
                reply("{'statusCode': 200, 'message': 'reloading'}");
                new DialplanReloader(rows[0]);
            }
        });




    } catch (e) {
        reply(Boom.notFound(e.message));
    }
};



module.exports = SwitchboardsController;
