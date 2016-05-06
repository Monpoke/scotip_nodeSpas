'use strict';

var SwitchboardDAO = require('../dao/SwitchboardDAO');
var fs = require('fs');
// or more concisely
var util = require('util')
var exec = require('child_process').exec;


/**
 * Dialplan reloader V2.
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

    this.generateAsteriskV2(rootModule, modules);

};


/**
 * Generate ASterisk dialplan.
 * @param rootModule
 * @param modules
 */
DialplanReloader.prototype.generateAsteriskV2 = function generateAsteriskV2(rootModule, modules) {

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
     * REGISTRATIONS
     */
    finalConf += "exten => start,1,Answer()" + "\n";

    // SOMES VARIABLES
    finalConf += "; Some variables for the dialplan" + "\n" +
        "same => n,Set(CURRENT_SWITCHBOARD_ID=" + this.switchboard.sid + ")" + "\n" +
        "same => n,Set(CURRENT_CALLER=${CALLERID(num)})" + "\n" +
        "same => n,Set(CALL_ID=${UNIQUEID})\n\n";


    // NOTIFY FROM CALL
    finalConf += "; NOTIFY CALL\n" +
        "same => n,Macro(newcall,CALL_DB_ID,\"${CURRENT_SWITCHBOARD_ID}\",\"${CURRENT_CALLER}\")\n\n";

    // GO TO ROOT MODULE
    finalConf += ";GO TO ROOT MODULE\n" +
        "same => n,Goto(${CONTEXT},mod_root,1)\n\n"


    // REGISTER HANGOUT ACTION
    finalConf += "exten => h,1,NoOp(\"HANGOUT\")\n" +
        "same => n,Macro(endcall,${CALL_DB_ID})\n\n";


    // ALL BINDS
    finalConf += "; ====================\n" +
        "; REGISTER ALL BINDS MODULES\n" +
        "; ====================\n";

    // for root
    finalConf += "exten => mod_root,1,Goto(${CONTEXT}," + this.modName(rootModule.mid) + ",1)\n";

    for (var i = 0, t = modules.length; i < t; i++) {
        var currentMod = modules[i];
        if (currentMod.phone_key == -1 || currentMod.moduleParent_mid == null) {
            continue;
        }
        finalConf += "exten => " + this.modBindName(currentMod.moduleParent_mid, currentMod.phone_key) + ",1,Goto(${CONTEXT}," + this.modName(currentMod.mid) + ",1)\n";
    }


    var totalRegistered = 0, total = (modules.length);
    this.createModuleConf(true, rootModule, modules, function (r) {
        totalRegistered++;
        finalConf += r + "\n";
    });

    /*
     * OTHERS MODULES
     */
    var dr = this;
    for (var i = 0, t = modules.length; i < t; i++) {
        var currentMod = modules[i];

        // skip root module
        if (currentMod.mid == rootModule.mid) {
            continue;
        }

        this.createModuleConf(false, currentMod, modules, function (r) {
            totalRegistered++;
            finalConf += r + "\n";
            if (totalRegistered === total) {
                dr.writeConf(finalConf);
            } else {
                console.log(totalRegistered + "/" + total);
            }
        });

    }

};


DialplanReloader.prototype.createModuleConf = function createModuleConf(isRoot, mod, modules, callback) {

    var dr = this;

    /**
     * Need to load configurations
     */
    SwitchboardDAO.loadModuleProperties(mod.mid, function (err, properties) {
        var re = "";

        // CHOOSE AN EXTENSION NAME
        var extenName = "mod_" + mod.mid;

        // HEADER
        re += "\n" +
            "; MODULE [" + mod.mid + "] " + mod.slug + "\n" +
            "exten => " + extenName + ",1,";


        // SOME VARIABLES
        re += "Set(CURRENT_MODULE_ID=" + mod.mid + ")" + "\n" +
            "same => n,Set(PARENT_MODULE_ID=" + mod.moduleParent_mid + ")\n";


        re += "same => n,";

        // CHECK MODULE
        if (mod.slug === "read") {
            var file = findProperty("file", properties);

            // SPECIAL ONE
            re += "Macro(wheretogo," + mod.mid + ",\"" + file + "\",\"scotip/200/invalidKey\")" + "\n";
        }

        else {
            re += dr.convertModuleToConf(mod, properties) + "\n";

            if (dr.moduleHasChildren(mod, modules)) {
                re += "same => n,Macro(wheretogo," + mod.mid + ",\"silence/1\",\"scotip/200/invalidKey\")" + "\n";
            }

        }

        callback(re);
    });


}


function findProperty(name, list) {
    for (var i = 0; i < list.length; i++) {
        if (list[i].settings_KEY === name) {
            return list[i].setting;
        }
    }
    return null;
}

DialplanReloader.prototype.convertModuleToConf = function convertModuleToConf(module, properties) {
    // JUST STATIC FOR NOW...
    var model = module.slug;

    console.log("Gen for model: " + model);

    if (model == "playback") {
        var file = findProperty("file", properties);
        return "Playback(" + file + ")";
    }

    else if (model == "read") {
        var file = findProperty("file", properties);
        return "Macro(wheretogo," + module.mid + ",\"" + file + "\",\"scotip/200/invalidKey\")" + "\n";

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


DialplanReloader.prototype.modName = function modName(id) {
    return "mod_" + id;
};

DialplanReloader.prototype.modBindName = function modBindName(parent, key) {
    return "mod" + parent + "key" + key;
};


module.exports = DialplanReloader;
