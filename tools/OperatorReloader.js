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

var fs = require('fs');
// or more concisely
var util = require('util')
var exec = require('child_process').exec;


/**
 * Dialplan reloader V2.
 * @param switchboard_data
 * @constructor
 */
function OperatorReloader(companyId, operator_data) {
    this.operators = operator_data;
    this.companyId = companyId;
    this.generateAsterisk();
};


/**
 * Generate ASterisk dialplan.
 * @param rootModule
 * @param modules
 */
OperatorReloader.prototype.generateAsterisk = function generateAsteriskV2() {

    var finalConf = "";

    /**
     * ACCESS CODE
     * FOR LINES
     */
    finalConf += "; CREATE OPERATORS " + "\n";

    for (var i = 0, t = this.operators.length; i < t; i++) {
        var currentOp = this.operators[i];
        if (currentOp.skype.readInt8(0) == 1) {
            continue;
        }

        finalConf += "[" + currentOp.name + "](scotipOperatorModel)\n" +
            "secret=" + currentOp.password + "\n\n";
    }


    this.writeConf(finalConf);


};


OperatorReloader.prototype.writeConf = function writeConf(configuration) {
    if (typeof process.env.PROD_SERVER !== "undefined" && process.env.PROD_SERVER == 1) {
        var basepath = "/usr/scotip/useroperators/";
    } else {
        // Other's computer
        var basepath = "./generated/";
    }

    var filename = "operators_" + this.companyId + ".conf";
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
                console.log("Operators reloaded.");

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
 * Try to reload SIP USERS asterisk.
 */
OperatorReloader.prototype.reloadAsterisk = function reloadAsterisk() {

    exec("asterisk -rx \"sip reload\"", function (error, stdout, stderr) {
        if (error) {
            console.log("ERROR! " + error);
        }
        else {
            console.log("Asterisk reloaded...");
        }
    });

};


module.exports = OperatorReloader;
