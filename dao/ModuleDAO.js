"use strict";

var db = require('../middleware/db');

function CallDAO() {
};
CallDAO.prototype = (function () {

    return {
        find: function find(mid, sid, callback) {
            var values = [
                mid,
                sid
            ];

            var sql = 'SELECT * FROM module AS m ' +
                'WHERE m.mid = ? AND m.switchboard_id = ?';

            db.query({
                sql: sql,
                values: values,
                callback: callback
            });
        },

        updateFile: function updateFile(mid, file, callback) {
            var values = [
                file,
                mid
            ];

            var sql = 'UPDATE module_settings  ' +
                    'SET setting = ? ' +
                'WHERE module_id = ? AND settings_key = "file"';

            db.query({
                sql: sql,
                values: values,
                callback: callback
            });
        }

    };
})();

var callDAO = new CallDAO();
module.exports = callDAO;