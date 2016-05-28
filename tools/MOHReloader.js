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
var QueueDAO = require('../dao/QueuesDAO');

/**
 * Dialplan reloader V2.
 * @param switchboard_data
 * @constructor
 */
function MOHReloader(company_id, moh) {
    this.moh = moh;
    this.companyId = company_id;
    this.generateAsterisk();
};


/**
 * Generate ASterisk dialplan.
 * @param rootModule
 * @param modules
 */
MOHReloader.prototype.generateAsterisk = function generateAsterisk() {
    var finalConf = "; MOH " +this.moh[i].switchboard_id  + "\n";

    for (var i = 0, t = this.moh.length; i < t; i++) {
        finalConf += "[SWI_" + this.moh[i].switchboard_id  + "_" + this.moh[i].group_name + "]" + "\n"
            + "mode=files" + "\n"
            + "directory=/usr/scotip/usermoh/files/" + this.moh[i].switchboard_id + "/" + this.moh[i].mohgroup_id + "\n\n";

    }

    this.writeConf(finalConf);
};


MOHReloader.prototype.writeConf = function writeConf(configuration) {
    if (typeof process.env.PROD_SERVER !== "undefined" && process.env.PROD_SERVER == 1) {
        var basepath = "/usr/scotip/usermoh/conf/";
    } else {
        // Other's computer
        var basepath = "./generated/";
    }

    var filename = "moh_" + this.companyId + ".conf";
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
 * Try to reload SIP USERS asterisk.
 */
MOHReloader.prototype.reloadAsterisk = function reloadAsterisk() {

    exec("asterisk -rx \"moh reload\"", function (error, stdout, stderr) {
        if (error) {
            console.log("ERROR! " + error);
        }
        else {
            console.log(stdout);
        }
    });

};


module.exports = MOHReloader;
