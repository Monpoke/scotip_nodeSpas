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
        },

        getModuleType: function updateFile(mid, callback) {
            var values = [
                mid
            ];

            var sql = 'SELECT ' +
                'module_model.slug, ' +
                'module.phone_key, module.phoneKeyDisabled ' +
                'FROM ' +
                'module ' +
                'INNER JOIN module_model ON module.model_id = module_model.model_id ' +
                'WHERE module.mid = ?';

            console.log(mid);

            db.query({
                sql: sql,
                values: values,
                callback: function(err,rows){
                    if(err){
                        throw err;
                    }
                    else if(rows.length === 0){
                        callback("unknown");
                    }
                    else {
                        callback(rows[0]);
                    }
                }
            });
        }

    };
})();

var callDAO = new CallDAO();
module.exports = callDAO;