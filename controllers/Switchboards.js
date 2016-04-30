'use strict';

var Boom = require('boom');
var TasksModel = require('../models/Tasks');

function SwitchboardsController(database) {
    //this.tasksModel = new TasksModel(database);
};

// [GET] /tasks/{id}
SwitchboardsController.prototype.regenerateDialplan = function(request, reply) {
    try {
        var id = request.params.id;

        //reply(this.tasksModel.getTask(id));
        reply("HelloWorld");
    } catch (e) {
        reply(Boom.notFound(e.message));
    }
};



module.exports = SwitchboardsController;
