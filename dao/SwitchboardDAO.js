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
                'module.phone_key, ' +
                'module.module_level, ' +
                'module.model_id, ' +
                'module.switchboard_id, ' +
                'module.moduleParent_mid, ' +
                ' module_model.slug ' +
                'FROM ' +
                'module ' +
                'INNER JOIN module_model ON module.model_id = module_model.model_id ' +
                'INNER JOIN switchboard ON module.switchboard_id = switchboard.sid ' +
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
        }


    };
})();

var switchboardDAO = new SwitchboardDAO();
module.exports = switchboardDAO;