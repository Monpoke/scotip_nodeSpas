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

'use strict';

var SwitchboardDAO = require('../dao/SwitchboardDAO');
var OperatorDAO = require('../dao/OperatorDAO');

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

    var target = this;
    OperatorDAO.findOperatorByCompany(switchboard_data.company_id, function (err, operators) {
        target.operators = operators;
        // load modules when operators are loaded
        target.loadModules();
    });


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
        console.log(err);
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
    /*
     * OTHERS MODULES
     */
    var dr = this;
    for (var i = 0, t = modules.length; i < t; i++) {
        var currentMod = modules[i];

        this.createModuleConf(false, currentMod, modules, function (r) {
            totalRegistered++;
            finalConf += r + "\n";
            if (totalRegistered === total) {
                dr.writeConf(finalConf);
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

        SwitchboardDAO.loadModuleFiles(mod.mid, function (err2, files) {

            var re = "";

            // CHOOSE AN EXTENSION NAME
            var extenName = "mod_" + mod.mid;

            // HEADER
            re += "\n" +
                "; MODULE [" + mod.mid + "] " + mod.slug + "\n" +
                "exten => " + extenName + ",1,NoOp(Mod " + mod.mid + ")\n";


            // SOME VARIABLES
            re += "same => n,Set(CURRENT_MODULE_ID=" + mod.mid + ")" + "\n" +
                "same => n,Set(PARENT_MODULE_ID=" + mod.moduleParent_mid + ")\n";


            // IF SOME MOH AVAILABLE
            if (mod.mohgroup_id != null) {
                re += "same => n,SetMusicOnHold(" + mod.group_name + ")" + "\n";
            }


            // FOR THE SPECIAL MODULE
            re += dr.convertModuleToConf(extenName, mod, properties, files);


            // CHECK MODULE
            /*  if (mod.slug === "read") {
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
             */

            // CHILDREN MODULES
            var childrenList = dr.childrenList(mod, modules);

            // IF ONLY ONE CHILD WITHOUT KEY, GO TO IT
            if (childrenList.length == 1 && childrenList[0].phoneKeyDisabled.readInt8() == 1) {
                re += "same => n,Goto(" + dr.modName(childrenList[0].mid) + ",1)" + "\n";
            }

            // ELSE, WAIT FOR INPUT
            else if (childrenList.length > 0) {

                var whereMessage;

                console.log(mod.slug + " -> " +findProperty("skip",properties));
                console.log(properties);

                // PLAYBACK NON SKIPPABLE, SO WE JUST PLAY A SILENCE
                if(mod.slug === "playback" && findProperty("skip",properties)!="1"){
                    whereMessage = "silence/1";
                } else {
                    whereMessage = dr.getValidFile(mod, "message", findProperty("message", files));
                }

                var inputError = dr.getValidFile(mod, "inputError", findProperty("inputError", files));

                // read module + go to extension
                re += "same => n,Macro(wheretogo," + mod.mid + ",\"" + whereMessage + "\",\"" + inputError + "\")" + "\n";


            } else {
                // CAN hangup
                re += "same => n,Hangup()" + "\n";

            }


            callback(re);

        });
    });


}


function findProperty(name, list) {
    for (var i = 0; i < list.length; i++) {
        if (typeof list[i].settings_KEY !== "undefined") {
            if (list[i].settings_KEY === name) {
                return list[i].setting;
            }
        }
        // FILE TYPE
        else {
            if (list[i].files_KEY === name) {
                return list[i].files;
            }
        }
    }
    return null;
}

DialplanReloader.prototype.convertModuleToConf = function convertModuleToConf(extenName, module, properties, files) {
    // JUST STATIC FOR NOW...
    var model = module.slug;

    console.log("Gen for model: " + model);

    var toReturn = "";

    if (model == "playback") {

        var canBeSkipped = findProperty("skip", properties);
        if (canBeSkipped == "1") {
            var file = this.getValidFile(module, "message", findProperty("message", files));
            toReturn += "same => n,Playback(" + file + ")" + "\n";
        }

    }

    else if (model == "operator") {
        var operator = this.getOperator(module.oid);

        if (operator === false) {
            toReturn += "same => n,Playback(operator&error)" + "\n";
        } else {
            var unavailableFile = this.getValidFile(module, "unavailableOpe", findProperty("unavailable", files));

            toReturn += "same => n,Dial(SIP/" + operator + ",,${GLOBAL_DIAL_TIMEOUT},m)" + "\n"
                + "same => n,Playback(" + unavailableFile + ")" + "\n";

        }

    }
    else if (model == "queue") {

        var unavailableFile = this.getValidFile(module, "unavailableQueue", findProperty("unavailable", files));

        toReturn += "same => n,Queue(" + module.asteriskName + ")" + "\n"
            + "same => n,Playback(" + unavailableFile + ")" + "\n";
    }
    else if (model == "userinput") {
        var file = this.getValidFile(module, "messageInput", findProperty("message", files));
        var inputError = this.getValidFile(module, "inputError", findProperty("inputError", files));

        var variableName = this.getValidVariableName(module, findProperty("variable", properties));
        var checkUrl = findProperty("uri", properties);
        var min = findProperty("numberFormatMin", properties) * 1;
        var max = findProperty("numberFormatMax", properties) * 1;

        toReturn += "same => n,Read(" + variableName + "," + file + ",,,3,15)" + "\n";

        // CHECK SYNTAX
        toReturn += "same => n,SET(VARLENGTH=${LEN(${" + variableName + "})})" + "\n";
        var failAction = "Macro(failuserinput," + extenName + "," + inputError + ")";
        var rightAction = ""; //":Playback(ok)";


        toReturn += "same => n,ExecIf($[ $[ ${VARLENGTH} < " + min + " ] | $[ ${VARLENGTH} > " + max + "] ]?" + failAction + rightAction + ")" + "\n";

        /**
         * @TODO Check URL + MULTIVARIABLES
         */
        if (checkUrl != null && checkUrl != "") {
            toReturn += "same => n,Macro(checkVariableValue," + extenName + "," + checkUrl + "," + variableName + ",${" + variableName + "}," + inputError + ")";
        }

        // SAVE ACTION
        toReturn += "same => n,Macro(savevariable,${CALL_ID}," + variableName + ",${" + variableName + "})" + "\n";
    }

    else {
        toReturn = "same => n,Playback(error)" + "\n";
    }

    return toReturn;
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

DialplanReloader.prototype.nbChildren = function nbChildren(module, othersModules) {
    var nb = 0;
    for (var i = 0, t = othersModules.length; i < t; i++) {
        if (othersModules[i].moduleParent_mid == module.mid) {
            nb++;
        }
    }
    return nb;
};

DialplanReloader.prototype.childrenList = function childrenList(module, othersModules) {
    var children = [];
    for (var i = 0, t = othersModules.length; i < t; i++) {
        if (othersModules[i].moduleParent_mid == module.mid) {
            children.push(othersModules[i]);
            ;
        }
    }
    return children;
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


/**
 * Returns a valid file.
 * @param module
 * @param filename
 * @param file
 * @returns {*}
 */
DialplanReloader.prototype.getValidFile = function getValidFile(module, filename, file) {
    if (file == null || file === "") {

        // SOME DEFAULTS

        return "silence/1&error";
    }

    // REPLACE CUSTOM AND LIBRARY
    // JUSt ON / FOR NOW
    var finalString = [];


    var parts = file.split("/");
    if (parts[0] == "custom") {
        // add switchboard id
        finalString.push("custom/" + module.switchboard_id + "/" + module.switchboard_id + "_" + parts[1]);
    } else {
        // library
        finalString.push(parts[1]);
    }

    // return
    return finalString.join("&");

};

/**
 * Returns a valid file.
 * @param module
 * @param filename
 * @param file
 * @returns {*}
 */
DialplanReloader.prototype.getValidVariableName = function getValidVariableName(module, varname) {
    if (varname == null || varname === "") {

        // SOME DEFAULTS

        return "USERVAR_" + "UNKNOWN";
    }
    return "USERVAR_" + varname;

};

/**
 * Returns an operator string.
 * @param oid
 * @returns {*}
 */
DialplanReloader.prototype.getOperator = function getValidFile(oid) {
    for (var i = 0, t = this.operators.length; i < t; i++) {
        if (this.operators[i].oid == oid) {
            if (this.operators[i].skype.readInt8() == 1) {
                return this.operators[i].name + "@skype";
            } else {
                return this.operators[i].name;
            }
        }
    }

    return false;
};


module.exports = DialplanReloader;
