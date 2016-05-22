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
var QueueDAO = require('../dao/QueuesDAO');

var QueueReloader = require('../tools/QueueReloader');

function QueuesController(database) {
    //this.switchboardDAO = new SwitchboardDAO();
};

// [GET] /operators/{companyId}
QueuesController.prototype.reloadQueue = function(request, reply) {
    try {
        var id = request.params.switchboardId * 1;

        QueueDAO.findBySwitchboard(id, function(err, rows){
            if(err){
                reply(Boom.notFound(err));
            }
            else if(rows.length == 0){
                reply(Boom.notFound("switchboard don't exists"))
            }
            else {
                reply("{'statusCode': 200, 'message': 'reloading'}");
                new QueueReloader(id, rows);
            }
        });


    } catch (e) {
        reply(Boom.notFound(e.message));
    }
};




module.exports = QueuesController;
