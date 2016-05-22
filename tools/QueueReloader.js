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
function QueueReloader(switchboard_id, queues) {
    this.queues = queues;
    this.switchboardId = switchboard_id;
    this.generateAsteriskV2();
};


/**
 * Generate ASterisk dialplan.
 * @param rootModule
 * @param modules
 */
QueueReloader.prototype.generateAsteriskV2 = function generateAsteriskV2() {

    var finalConf = "";

    /**
     * ACCESS CODE
     * FOR LINES
     */
    finalConf += "; QUEUES " + "\n";

    console.log(this.queues);

    var target = this;

    var toWrite = this.queues.length,
        totalWriten = 0;

    for (var i = 0, t = toWrite; i < t; i++) {
        var currentQu = this.queues[i];


        QueueDAO.findOperators(currentQu.qid, currentQu, function (currentQu, err, ope) {

            if (err) {
                console.log('ERROR!');
                console.log(err);
                return;
            }

            // HEADER
            finalConf += "[" + currentQu.asteriskName + "](scotipQueueModel)\n";
            for (var i = 0, t = ope.length; i < t; i++) {
                finalConf += "member => " + ope[i].name;
                if (ope[i].skype.readInt8() == 1) {
                    finalConf += "@skype";
                }

                finalConf += "\n";
            }

            finalConf += "\n";

            checkConf();
        });

    }

    function checkConf(){
        totalWriten++;

        if(totalWriten>=toWrite){
            target.writeConf(finalConf);
        }
    }



};


QueueReloader.prototype.writeConf = function writeConf(configuration) {
    if (typeof process.env.PROD_SERVER !== "undefined" && process.env.PROD_SERVER == 1) {
        var basepath = "/usr/scotip/userqueues/";
    } else {
        // Other's computer
        var basepath = "./generated/";
    }

    var filename = "queues_" + this.switchboardId + ".conf";
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
QueueReloader.prototype.reloadAsterisk = function reloadAsterisk() {

    exec("asterisk -rx \"queue reload all\"", function (error, stdout, stderr) {
        if (error) {
            console.log("ERROR! " + error);
        }
        else {
            console.log(stdout);
        }
    });

};


module.exports = QueueReloader;
