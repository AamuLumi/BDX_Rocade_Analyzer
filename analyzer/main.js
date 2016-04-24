'use strict';

require('console-stamp')(console, '[HH:MM:ss.l]');

let cv = require('opencv'),
    mongoose = require('mongoose'),
    async = require('async'),
//    fs = require('fs'),
    ColorTools = require('./ColorTools'),
    ColorConst = ColorTools.const,
    NetworkTools = require('./NetworkTools'),
    PartEntry = require('root-require')('server/PartEntry'),
    pjson = require('root-require')('package.json'),
    Rocade = require('./Rocade');

// Mongoose Connection
mongoose.connect('mongodb://localhost/roccade');
mongoose.connection.on('error',
    console.error.bind(console, 'connection error:'));

// Constants
// const thresholdRoads = 50;
// const maxDistanceBetweenRoads = 15;
const minimumPartPixels = 20;
// Constant used by the function partAround
// It serves to determine if the part is around the center,
//   which avoid unfound parts because of center moved by 1 pixel.
const thresholdAround = 3;

const TRAFFIC_GREEN = 0;
const TRAFFIC_ORANGE = 1;
const TRAFFIC_RED = 2;
const TRAFFIC_BLACK = 3;

const NOT_FOUND = -1;

const DELAY_TIME = 300000;

let inputFilename = __dirname + '/in.png';
let outputFilename = undefined;

// Variables
let resultMatrix = [];
let calculatedMatrix = [];
let pixelsColor = [];
let parts = [];
// let blocks = [];
let currentAnalysis = 0;
let ids = {};

// Fill pixels array with all pixel of the part
// This is a flood-fill algorithm
let determinePixelsInPart = function(im, x, y, pixels) {
    if (im.get(y, x) > 0) {
        im.set(y, x, 0);
        pixels.push({
            x: x,
            y: y
        });

        if (x + 1 < im.width()) {
            determinePixelsInPart(im, x + 1, y, pixels);
        }
        if (x - 1 > 0) {
            determinePixelsInPart(im, x - 1, y, pixels);
        }
        if (y + 1 < im.height()) {
            determinePixelsInPart(im, x, y + 1, pixels);
        }
        if (y - 1 > 0) {
            determinePixelsInPart(im, x, y - 1, pixels);
        }
    }
};

// Calculate a part containing pixel (x,y)
let calculatePart = function(im, x, y) {
    let pixels = [];

    determinePixelsInPart(im, x, y, pixels);

    if (pixels.length < minimumPartPixels) {
        return undefined;
    }

    return {
        pixels: pixels
    };
};

// Calculate the color of a part
let determineColorForPart = function(part, colors) {
    let colored = {
        green: 0,
        orange: 0,
        red: 0,
        black: 0
    };

    for (let pixel of part.pixels) {
        let p = colors[pixel.x + '-' + pixel.y];
        if (p === ColorConst.G_GREEN) {
            colored.green++;
        } else if (p === ColorConst.G_ORANGE) {
            colored.orange++;
        } else if (p === ColorConst.G_RED) {
            colored.red++;
        } else if (p === ColorConst.G_BLACK) {
            colored.black++;
        }
    }

    let moreGreenThanOrange = colored.green > colored.orange;
    let moreGreenThanRed = colored.green > colored.red;
    let moreGreenThanBlack = colored.green > colored.black;
    let moreOrangeThanRed = colored.orange > colored.red;
    let moreOrangeThanBlack = colored.orange > colored.black;
    let moreRedThanBlack = colored.red > colored.black;

    if (moreGreenThanOrange && moreGreenThanRed &&
        moreGreenThanBlack) {
        return 'green';
    } else if (moreOrangeThanRed && moreOrangeThanBlack) {
        return 'orange';
    } else if (moreRedThanBlack) {
        return 'red';
    } else {
        return 'black';
    }
};

// Calculate the center of a part
let determineCenterForPart = function(part) {
    let x = 0,
        y = 0;

    for (let p of part.pixels) {
        x += p.x;
        y += p.y;
    }

    return [parseInt(x / part.pixels.length), parseInt(y /
        part.pixels.length)];
};

let generateIds = function() {
    for (let parts of Rocade.parts) {
        for (let part of parts.parts) {
            for (let e of part) {
                if (!ids[e.center[0]]) {
                    ids[e.center[0]] = {};
                }

                ids[e.center[0]][e.center[1]] = e.partNumber;
            }
        }
    }
};

let getIdFor = function(center) {
  // !== undefined is needed, because there's a part which id is 0
  //   so without undefined, it considers condition false
  if (ids[center[0]] && ids[center[0]][center[1]] !== undefined) {
      return ids[center[0]][center[1]];
  } else { // Id not found, so search around center
    let minX = center[0] - thresholdAround,
      maxX = center[0] + thresholdAround,
      minY = center[1] - thresholdAround,
      maxY = center[1] + thresholdAround;

    for (let i = minX; i < maxX; i++){
      for (let j = minY; j < maxY; j++){
        if (ids[i] && ids[i][j]){
          return ids[i][j];
        }
      }
    }

    return NOT_FOUND;
  }
};

let otherIn = process.argv.indexOf('-i');
if (otherIn !== NOT_FOUND) {
    inputFilename = process.argv[otherIn + 1];
}

let otherOut = process.argv.indexOf('-o');
if (otherOut !== NOT_FOUND) {
    outputFilename = process.argv[otherOut + 1];
}

generateIds();

// Main code
let main = function main() {
    cv.readImage(inputFilename, function(err, im) {
        if (err) {
            throw err;
        }

        console.log('=> Analysis ' + currentAnalysis);

        pixelsColor = {};
        parts = [];

        resultMatrix = new cv.Matrix.Zeros(im.width(),
            im.height());
        calculatedMatrix = new cv.Matrix.Zeros(im.width(),
            im.height());

        // Determine traffic color of image and transform it
        //  to a grayscale matrix
        console.log('> Reading pixels');
        for (let i = 0; i < im.width(); i++) {
            for (let j = 0; j < im.height(); j++) {
                if (ColorTools.is(ColorConst.GREEN,
                        im.pixel(j, i))) {
                    pixelsColor[i + '-' + j] =
                        ColorConst.G_GREEN;
                    resultMatrix.set(j, i,
                        ColorConst.G_GREEN);
                } else if (ColorTools.is(ColorConst.ORANGE,
                        im.pixel(j, i))) {
                    pixelsColor[i + '-' + j] =
                        ColorConst.G_ORANGE;
                    resultMatrix.set(j, i,
                        ColorConst.G_ORANGE);
                } else if (ColorTools.is(ColorConst.RED,
                        im.pixel(j, i))) {
                    pixelsColor[i + '-' + j] =
                        ColorConst.G_RED;
                    resultMatrix.set(j, i,
                        ColorConst.G_RED);
                } else if (ColorTools.is(ColorConst.BLACK,
                        im.pixel(j, i))) {
                    pixelsColor[i + '-' + j] =
                        ColorConst.G_BLACK;
                    resultMatrix.set(j, i,
                        ColorConst.G_BLACK);
                }
            }
        }

        if (process.argv.indexOf('--no-parts') !==
            NOT_FOUND) {
            resultMatrix.save(outputFilename);
            return;
        }

        // Create parts for group all pixels
        console.log('> Determine parts of roads');
        for (let i = 0; i < im.width(); i++) {
            for (let j = 0; j < im.height(); j++) {
                if (resultMatrix.get(j, i) > 0) {
                    let part = calculatePart(
                        resultMatrix, i, j);

                    if (part) {
                        part.color =
                            determineColorForPart(
                                part, pixelsColor);
                        part.center =
                            determineCenterForPart(
                                part);
                        parts.push(part);
                    }
                }
            }
        }

        console.log(
            '> Creating output file and records'
        );
        // Fill calculatedMatrix with found parts
        let entries = [];
        let saves = [];
        let currentDate = Date.now();

        for (let part of parts) {
            let p = new PartEntry();
            p.partNumber = getIdFor(part.center);
            p.date = currentDate;

            if (part.color === 'orange') {
                p.trafficState = TRAFFIC_ORANGE;
            } else if (part.color === 'green') {
                p.trafficState = TRAFFIC_GREEN;
            } else if (part.color === 'red') {
                p.trafficState = TRAFFIC_RED;
            } else {
                p.trafficState = TRAFFIC_BLACK;
            }

            if (outputFilename) {
                if (part.color === 'orange') {
                    for (let p of part.pixels) {
                        calculatedMatrix.set(p.y, p.x,
                            ColorConst.G_ORANGE);
                    }
                } else if (part.color === 'green') {
                    for (let p of part.pixels) {
                        calculatedMatrix.set(p.y, p.x,
                            ColorConst.G_GREEN);
                    }
                } else if (part.color === 'red') {
                    for (let p of part.pixels) {
                        calculatedMatrix.set(p.y, p.x,
                            ColorConst.G_RED);
                    }
                } else {
                    for (let p of part.pixels) {
                        calculatedMatrix.set(p.y, p.x,
                            ColorConst.G_BLACK);
                    }
                }
            }

            if (p.partNumber >= 0) {
                saves.push(function saveEntry(
                    callback) {
                    p.save((err, entry) => {
                        if (err) {
                            console.error(
                                err
                            );
                        } else {
                            entries.push(
                                entry
                            );
                        }
                        callback();
                    });
                });
            }
        }


        async.parallel(saves, () => {
            console.log('> ' + entries.length +
                ' entries saved on ' +
                parts.length);
        });

        // Save matrix
        if (outputFilename) {
            console.log('> Saving ...');
            calculatedMatrix.save(outputFilename);
        }

        console.log('> Analysis ended\n');
    });
};

console.log('== Bdx Roccade Traffic Analysis v' + pjson.version +
    ' ==\n');

NetworkTools.download(
    'http://hackjack.info/rocade/bordeaux/images/',
    inputFilename, main);

setInterval(() => {
    NetworkTools.download(
        'http://hackjack.info/rocade/bordeaux/images/',
        inputFilename, main);
}, DELAY_TIME);
