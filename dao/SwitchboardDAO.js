"use strict";

var db = require('middleware/db');

function SwitchboardDAO() {
};
SwitchboardDAO.prototype = (function () {

    return {
        find: function find(id, callback) {
            var values = [
                id
            ];

            var sql = 'SELECT * FROM company AS c ' +
                'WHERE c.id = ?';

            db.query({
                sql: sql,
                values: values,
                callback: callback
            });
        }
    };
})();

var switchboardDAO = new SwitchboardDAO();
module.exports = switchboardDAO;