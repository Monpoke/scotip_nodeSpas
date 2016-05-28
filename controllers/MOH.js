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
var MOHDAO = require('../dao/MOHDAO');

var MOHReloader = require('../tools/MOHReloader');

function MOHController(database) {
    //this.switchboardDAO = new SwitchboardDAO();
};

// [GET] /moh/{companyId}
MOHController.prototype.genConf = function(request, reply) {
    try {
        var companyId = request.params.companyId * 1;

        MOHDAO.findByCompany(companyId, function(err, mohList){
            if(err){
                reply(Boom.notFound(err));
            }
            else {
                reply("{'statusCode': 200, 'message': 'reloading moh'}");
                new MOHReloader(companyId, mohList);
            }
        });


    } catch (e) {
        reply(Boom.notFound(e.message));
    }
};




module.exports = MOHController;
