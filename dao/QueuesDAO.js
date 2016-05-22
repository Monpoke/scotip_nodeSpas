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

"use strict";

var db = require('../middleware/db');

function QueuesDAO() {
};
QueuesDAO.prototype = (function () {

    return {
        findBySwitchboard: function findOperatorByCompany(id, callback) {
            var values = [
                id
            ];

            var sql = "SELECT " +
                "queue.qid, " +
                "queue.asteriskName, " +
                "queue.`name`, " +
                "queue.switchboard_id, " +
                "queue.publicData " +
                "FROM " +
                "queue " +
                "WHERE queue.switchboard_id = ?";

            db.query({
                sql: sql,
                values: values,
                callback: callback
            });

            console.log(sql);


        },

        findOperators: function findOperators(qid, queueData, callback) {
            var values = [
                qid
            ];

            var sql = "SELECT " +
                "operator.`name`, " +
                "queue_operator.queue_id, " +
                "queue_operator.operator_id, " +
                "operator.oid, " +
                "operator.`password`, " +
                "operator.company_id, " +
                "operator.skype " +
                "FROM " +
                "queue_operator " +
                "INNER JOIN operator ON queue_operator.operator_id = operator.oid " +
                "WHERE queue_operator.queue_id = ?";

            db.query({
                sql: sql,
                values: values,
                callback: function(err,rows){
                    callback(queueData, err, rows);
                }
            });


        },

    };
})();

var QueuesDAO = new QueuesDAO();
module.exports = QueuesDAO;