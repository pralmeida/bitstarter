#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function($, checksfile) {
    //$ = cheerioHtmlFile(htmlfile, url);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    console.log(JSON.stringify(out, null, 4));
};

var checkHtml = function (htmlfile, url, checksfile) {
    /* 
       If both --file and --url are used, --file is the one used 
       If newither is used, and error message is displayed and the process terminates.
     */
    if (htmlfile) {
	$ = cheerioHtmlFile(htmlfile); // read the file and load ir into a cheerio object
	checkHtmlFile($, checksfile); // do the checks and output the result
    } else if (url) {
	// use restler api to load the URL. This is an async call, so all the actions necessary
	// to complete the code are in the else below.
	rest.get(url).on('complete', function(result) {
	    if (result instanceof Error) {	
		sys.puts('Error: ' + result.message);
		this.retry(5000); // try again after 5 sec
	    } else {
		$ = cheerio.load(result); // create a cheerio object from the html read from the URL
		checkHtmlFile($, checksfile); // do the checks and output the result
	    }
	});
    } else {
	console.log ('--file or --url not found. Please use one of them.');
	process.exit(1);
    }
};


var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html')
        .option('-u, --url <url>', 'URL to validate')
        .parse(process.argv);

    checkHtml(program.file, program.url, program.checks);

} else {
    exports.checkHtmlFile = checkHtmlFile;
}
