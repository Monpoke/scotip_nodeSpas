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

function MOHDAO() {
};
MOHDAO.prototype = (function () {

    return {
        findByCompany: function findByCompany(id, callback) {
            var values = [
                id
            ];

            var sql = "SELECT " +
                "moh_group.mohgroup_id, " +
                "moh_group.group_name, " +
                "moh_group.switchboard_id " +
                "FROM " +
                "moh_group " +
                "INNER JOIN switchboard ON moh_group.switchboard_id = switchboard.sid " +
                "INNER JOIN company ON switchboard.company_id = company.id " +
                "WHERE company.id = ?";

            db.query({
                sql: sql,
                values: values,
                callback: callback
            });
        }
    };
})();

var mohDAO = new MOHDAO();
module.exports = mohDAO;