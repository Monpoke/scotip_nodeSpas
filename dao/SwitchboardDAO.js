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

function SwitchboardDAO() {
};
SwitchboardDAO.prototype = (function () {

    return {
        find: function find(id, callback) {
            var values = [
                id
            ];

            var sql = 'SELECT * FROM switchboard AS c ' +
                'WHERE c.sid = ?';

            db.query({
                sql: sql,
                values: values,
                callback: callback
            });
        },


        loadAllModules: function loadAllModules(sid, callback) {
            var values = [
                sid
            ];

            var sql = 'SELECT ' +
                'module.mid, ' +
                'module.module_level, ' +
                'module.phone_key, ' +
                'module.model_id, ' +
                'module.moduleParent_mid, ' +
                'module.switchboard_id, ' +
                'module.description, ' +
                'module.phoneKeyDisabled, ' +
                'operator.`name`, ' +
                'operator.`password`, ' +
                'operator.company_id, ' +
                'operator.skype, ' +
                'queue.asteriskName, ' +
                'queue.publicData, ' +
                'moh_group.mohgroup_id, ' +
                'moh_group.group_name, ' +
                'module_model.slug, ' +
                'queue.qid, ' +
                'operator.oid ' +
                'FROM ' +
                'module ' +
                'LEFT JOIN operator ON module.operator_oid = operator.oid ' +
                'LEFT JOIN queue ON module.queue_qid = queue.qid ' +
                'LEFT JOIN moh_group ON module.mohGroup_mohgroup_id = moh_group.mohgroup_id ' +
                'INNER JOIN module_model ON module.model_id = module_model.model_id ' +
                'WHERE module.switchboard_id = ?';

            db.query({
                sql: sql,
                values: values,
                callback: callback
            });
        },

        loadModuleProperties: function loadModuleProperties(mid, callback) {
            var values = [
                mid
            ];

            var sql = 'SELECT ' +
                'module_settings.module_id, ' +
                'module_settings.setting, ' +
                'module_settings.settings_KEY ' +
                'FROM ' +
                'module_settings ' +
                'WHERE module_settings.module_id = ?';

            db.query({
                sql: sql,
                values: values,
                callback: callback
            });
        },

        loadModuleFiles: function loadModuleFiles(mid, callback) {
            var values = [
                mid
            ];

            var sql = 'SELECT ' +
                'module_files.module_id, ' +
                'module_files.files, ' +
                'module_files.files_KEY ' +
                'FROM ' +
                'module_files ' +
                'WHERE module_files.module_id = ?';

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