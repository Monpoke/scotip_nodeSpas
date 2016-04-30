'use strict';

var SwitchboardDAO = require('../dao/SwitchboardDAO');

function DialplanReloader(switchboard_data) {
    this.switchboard = switchboard_data;

    this.loadModules();

};

/**
 * Loads all modules from database.
 */
DialplanReloader.prototype.loadModules = function() {
    var switchboard = this.switchboard;

    SwitchboardDAO.loadAllModules(this.switchboard.sid, function(err, rows){
        console.log("Loading modules for switchboard " + switchboard.sid);

        console.log(err);
        console.log(rows);
    });

};


module.exports = DialplanReloader;
