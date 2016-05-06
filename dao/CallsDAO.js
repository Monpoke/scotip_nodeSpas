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

        endCall: function registerNewCall(call_id, data, callback) {
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

        }
    };
})();

var callDAO = new CallDAO();
module.exports = callDAO;