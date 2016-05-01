'use strict';

var SwitchboardDAO = require('../dao/SwitchboardDAO');
var fs = require('fs');
// or more concisely
var util = require('util')
var exec = require('child_process').exec;


/**
 * Dialplan reloader.
 * @param switchboard_data
 * @constructor
 */
function DialplanReloader(switchboard_data) {
    this.switchboard = switchboard_data;

    this.loadModules();

};

/**
 * Loads all modules from database.
 */
DialplanReloader.prototype.loadModules = function loadModules() {
    var switchboard = this.switchboard;
    var obj = this;

    SwitchboardDAO.loadAllModules(this.switchboard.sid, function (err, mods) {
        obj.checkModules(err, mods);
    });

};

/**
 * Process all modules.
 */
DialplanReloader.prototype.checkModules = function checkModules(err, modules) {
    console.log("Loading modules for switchboard " + this.switchboard.sid);

    if (err != null) {
        console.log(e);
        return false;
    }

    else if (modules.length == 0) {
        console.log("NO MODULES FOUND... OOOPS.");
        return false;
    }

    /*
     * Check for root module
     */
    var rootModule = this.findRootModule(modules);
    if (rootModule == -1) {
        console.log("NO ROOT MODULE, ABORTING.");
        return false;
    } else if (rootModule == -2) {
        console.log("SEVERAL ROOT MODULES FOUND, ABORTING.");
        return false;
    }

    this.generateAsteriskV1(rootModule, modules);

};


/**
 * Generate ASterisk dialplan.
 * @param rootModule
 * @param modules
 */
DialplanReloader.prototype.generateAsteriskV1 = function generateAsteriskV1(rootModule, modules) {

    var finalConf = "";

    /**
     * ACCESS CODE
     * FOR LINES
     */
    finalConf += "; ACCESS LINE " + "\n"
        + "[scotip_user_" + this.switchboard.phoneCodeAccess + "]" + "\n"
        + "exten => start,1,Goto(dialplan_user_" + this.switchboard.sid + ",start,1)" + "\n\n";


    /**
     * DIALPLAN
     * HEADER SECTION
     */
    finalConf += "; DIALPLAN CONFIGURATION" + "\n"
        + "[dialplan_user_" + this.switchboard.sid + "]" + "\n";

    /*
     * ROOT MODULE
     */
    finalConf += "exten => start,1,Answer()" + "\n";
    //finalConf += "same => n," + this.convertModuleToConf(rootModule) + "\n";

    if (this.moduleHasChildren(rootModule, modules)) {
        finalConf += "same => n,Macro(wheretogo," + rootModule.mid + ",\"silence/1&scotip/200/FR_Welcome\",\"scotip/200/invalidKey\")" + "\n";
    }
    finalConf += "\n";


    /*
     * OTHERS MODULES
     */
    for (var i = 0, t = modules.length; i < t; i++) {
        var currentMod = modules[i];

        // skip root module
        if (currentMod.mid == rootModule.mid) {
            continue;
        }

        // EXTENSION NAME, IN ORDER TO BE REACHED FROM ITS PARENT
        var extenName = "mod" + currentMod.moduleParent_mid + "key" + currentMod.phone_key;

        // START CONFIGURATION
        finalConf += "; MODULE [" + currentMod.mid + "] " + currentMod.slug + "\n";
        finalConf += "exten => " + extenName + ",1," + this.convertModuleToConf(currentMod) + "\n";

        /**
         * If there is a child with phone_key...
         */
        if (this.moduleHasChildren(currentMod, modules)) {
            finalConf += "same => n,Macro(wheretogo," + currentMod.mid + ",\"silence/1\",666)" + "\n";
        }

        finalConf += "\n";

    }

    this.writeConf(finalConf);
};


DialplanReloader.prototype.convertModuleToConf = function convertModuleToConf(module) {
    // JUST STATIC FOR NOW...
    var model = module.slug;
    if (model == "playblack_3") {
        return "SayDigits(3)"
    }
    else if (model == "playback_1") {
        return "SayDigits(1)"
    } else if (model == "playback_helloworld") {
        return "Playback(hello-world)";
    }
    else if (model == "playback_welcome") {
        return "Playback(silence/1&scotip/200/FR_Welcome)";
    } else if (model == "playback_about") {
        return "Playback(silence/1&scotip/200/FR_About)";
    }
    else if (model == "playback_about_services") {
        return "Playback(silence/1&hello-world)";
    }
    else {
        return "Playback(error)";
    }
};

/**
 * Returns true if module has some children.
 * @param module
 * @param othersModules
 * @returns {boolean}
 */
DialplanReloader.prototype.moduleHasChildren = function moduleHasChildren(module, othersModules) {
    for (var i = 0, t = othersModules.length; i < t; i++) {
        if (othersModules[i].moduleParent_mid == module.mid) {
            return true;
        }
    }
    return false;
};


DialplanReloader.prototype.writeConf = function writeConf(configuration) {
    if (typeof process.env.PROD_SERVER !== "undefined" && process.env.PROD_SERVER == 1) {
        var basepath = "/usr/scotip/userdialplans/";
    } else {
        // Other's computer
        var basepath = "./generated/";
    }

    var filename = "user_" + this.switchboard.sid + ".conf";
    var totalFilepath = basepath + filename;


    /**
     * To write file.
     * @param callback
     */
    function createFile(callback) {
        // create file
        fs.writeFile(totalFilepath, configuration, null, function (err) {
            if (err) {
                console.log("ERREUR :");
                console.log(err);
            } else {
                console.log("Conf OK");

                if (callback) {
                    callback();
                }
            }
        });
    }

    /**
     * It creates file...
     */
    createFile(this.reloadAsterisk);
};

/**
 * Try to reload asterisk.
 */
DialplanReloader.prototype.reloadAsterisk = function reloadAsterisk() {

    exec("asterisk -rx \"dialplan reload\"", function (error, stdout, stderr) {
        if (error) {
            console.log("ERROR! " + error);
        }
        else {
            console.log(stdout);
        }
    });

};


/**
 * Find root module.
 * @param modules
 * @returns {number}
 */
DialplanReloader.prototype.findRootModule = function (modules) {
    var rootMod = -1;

    for (var i = 0, t = modules.length; i < t; i++) {
        var currentMod = modules[i];
        if (currentMod.moduleParent_mid == null && currentMod.module_level == 1) {
            if (rootMod != -1) {
                rootMod = -2;
                break;
            }
            rootMod = currentMod;
        }
    }

    return rootMod;
}


module.exports = DialplanReloader;
