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

function CallDAO() {
};
CallDAO.prototype = (function () {

    return {
        find: function find(id, callback) {
            var values = [
                id
            ];

            var sql = 'SELECT * FROM call_logs AS c ' +
                'WHERE c.callid = ?';

            db.query({
                sql: sql,
                values: values,
                callback: callback
            });
        },

        registerNewCall: function registerNewCall(switchboard_id, call, callback) {
            var values = [
                switchboard_id,
                call.callerid,
                call.timestamp
            ];

            var sql = 'INSERT INTO call_logs (switchboard_id, caller_number, timestamp, finished, duration)' +
                ' VALUES(?, ?, ?, 0, 0)';

            db.query({
                sql: sql,
                values: values,
                callback: function (err, result) {
                    if (err) throw err;
                    callback(result.insertId);
                }
            })

        },

        endCall: function registerEndCall(call_id, data, callback) {
            var values = [
                data.duration,
                call_id
            ];

            var sql = 'UPDATE call_logs SET finished=1, duration = ? WHERE callid = ?';

            db.query({
                sql: sql,
                values: values,
                callback: function (err, result) {
                    if (err) throw err;
                    callback(err,result);
                }
            })

        },

        saveAction: function saveAction(call_id, data, callback) {
            var values = [
                call_id,
                data.action
            ];

            var sql = 'INSERT INTO call_logs_actions(calllog_id, actions) VALUES (?,?)';

            db.query({
                sql: sql,
                values: values,
                callback: function (err, result) {
                    if (err) throw err;
                    callback(err,result);
                }
            })

        },

        saveVariable: function saveAction(call_id, data, callback) {
            var values = [
                call_id,
                data.varname,
                data.value
            ];

            var sql = 'INSERT INTO call_logs_variables(calllog_id, variables_KEY, variables) VALUES (?,?,?)';

            db.query({
                sql: sql,
                values: values,
                callback: function (err, result) {
                    if (err) throw err;
                    callback(err,result);
                }
            })

        }
    };
})();

var callDAO = new CallDAO();
module.exports = callDAO;