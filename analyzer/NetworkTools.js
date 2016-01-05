'use strict';

let fs = require('fs'),
    request = require("request");

// Download a file
module.exports.download = function(uri, filename, callback) {
  request.head(uri, function(err, res, body) {
    console.log("> Downloading image");

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};
