#!/usr/bin/env node
'use strict';

var spawn = require('child_process').spawn;

function toStdOut(data) {
	process.stdout.write(data.toString());
}

function toStdErr(data) {
	process.stderr.write(data.toString());
}

var casper = spawn(__dirname + '/../node_modules/.bin/casperjs', ["test", "test/visual/test.js"], { cwd: process.cwd(), env: process.env });

casper.stdout.on('data', toStdOut);
casper.stderr.on('data', toStdErr);
casper.on('error', reject);
casper.on('close', function(code, signal) {
	if (code === 0) {
		resolve();
	} else {
		reject("Myrtlejs exited with " + code + ', signal ' + signal);
	}
});
