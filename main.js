'use strict';

let cv = require("opencv"),
  request = require("request"),
  mongoose = require("mongoose"),
  fs = require('fs'),
  async = require('async');

// Mongoose Connection
mongoose.connect('mongodb://localhost/roccade');
mongoose.connection.on('error',
  console.error.bind(console, 'connection error:'));

// Database Variables
let PartEntrySchema = new mongoose.Schema({
  date: Date,
  partNumber: Number,
  trafficState: Number
});

let PartEntry = mongoose.model('PartEntry', PartEntrySchema);

// Colors
let GREEN = [0, 255, 0];
let ORANGE = [0, 154, 255];
let RED = [0, 0, 255];
let BLACK = [0, 0, 0];

let G_GREEN = 255;
let G_ORANGE = 192;
let G_RED = 128;
let G_BLACK = 64;

// Constants
const threshold = 5;
const thresholdRoads = 50;
const maxDistanceBetweenRoads = 15;
const minimumPartPixels = 20;

const TRAFFIC_GREEN = 0;
const TRAFFIC_ORANGE = 1;
const TRAFFIC_RED = 2;
const TRAFFIC_BLACK = 3;

let inputFilename = "./in.png";
let outputFilename = "./out.png";

const inCoordonates = [{
  x: 836,
  y: 290
}, {
  x: 804,
  y: 280
}, {
  x: 853,
  y: 342
}];

const outCoordonates = [{
  x: 817,
  y: 269
}, {
  x: 808,
  y: 271
}, {
  x: 846,
  y: 342
}];

// Variables
let resultMatrix;
let calculatedMatrix;
let pixelsColor;
let parts;
let blocks;

// Download a file
let download = function(uri, filename, callback) {
  request.head(uri, function(err, res, body) {
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

// Test if a pixel is a kind of color
let is = function(color, pixel) {
  return isAround(color[0], pixel[0]) && isAround(color[1], pixel[1]) && isAround(color[2], pixel[2]);
}

// Check a value around another
let isAround = function(colorValue, pixelValue) {
  return pixelValue >= colorValue - threshold && pixelValue <= colorValue + threshold;
}

// Calculate a part containing pixel (x,y)
let calculatePart = function(im, x, y) {
  let pixels = [];

  determinePixelsInPart(im, x, y, pixels);

  if (pixels.length < minimumPartPixels)
    return undefined;

  return {
    pixels: pixels
  };
}

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
    if (p == G_GREEN) colored.green++;
    else if (p == G_ORANGE) colored.orange++;
    else if (p == G_RED) colored.red++;
    else if (p == G_BLACK) colored.black++;
  }

  let moreGreenThanOrange = colored.green > colored.orange;
  let moreGreenThanRed = colored.green > colored.red;
  let moreGreenThanBlack = colored.green > colored.black;
  let moreOrangeThanRed = colored.orange > colored.red;
  let moreOrangeThanBlack = colored.orange > colored.black;
  let moreRedThanBlack = colored.red > colored.black;

  if (moreGreenThanOrange && moreGreenThanRed && moreGreenThanBlack)
    return 'green';
  else if (moreOrangeThanRed && moreOrangeThanBlack)
    return 'orange';
  else if (moreRedThanBlack)
    return 'red';
  else
    return 'black';
}

// Fill pixels array with all pixel of the part
// This is a flood-fill algorithm
let determinePixelsInPart = function(im, x, y, pixels) {
  if (im.get(y, x) > 0) {
    im.set(y, x, 0);
    pixels.push({
      x: x,
      y: y
    });

    if (x + 1 < im.width()) determinePixelsInPart(im, x + 1, y, pixels);
    if (x - 1 > 0) determinePixelsInPart(im, x - 1, y, pixels);
    if (y + 1 < im.height()) determinePixelsInPart(im, x, y + 1, pixels);
    if (y - 1 > 0) determinePixelsInPart(im, x, y - 1, pixels);
  }
}

// Calculate the center of a part
let determineCenterForPart = function(part) {
  let x = 0,
    y = 0;

  for (let p of part.pixels) {
    x += p.x;
    y += p.y;
  }

  return [parseInt(x / part.pixels.length), parseInt(y / part.pixels.length)];
}

// Calculate distance between 2 points
let distanceBetween = function(p1, p2) {
  return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
}

// Search nearest part and return its color
let getColorForNearestPart = function(parts, x, y) {
  let currentParts = [];

  for (let p of parts) {
    let d = distanceBetween(p.center, [x, y]);
    if (d < thresholdRoads) {
      currentParts.push(p);
    }
  }

  for (let p of currentParts) {
    for (let pix of p.pixels) {
      if (pix.x == x && pix.y == y) return p.color;
    }
  }

  let currentPart = parts[0];
  let currentDistance = 0xFFFFFF;

  for (let p of parts) {
    let d = distanceBetween(p.center, [x, y]);
    if (d < currentDistance) {
      currentPart = p;
      currentDistance = d;
    }
  }

  return currentPart.color;
}

let searchNeighboursFor = function searchNeighboursFor(parts, part) {
  let block = [part];

  parts.splice(parts.indexOf(part), 1);

  for (let p of parts) {
    console.log(distanceBetween(part.center, p.center));
    if (distanceBetween(part.center, p.center) < maxDistanceBetweenRoads) {
      block.push(p);
      parts.splice(parts.indexOf(p), 1);
    }
  }

  return block;
}

let otherIn = process.argv.indexOf('-i');
if (otherIn != -1) inputFilename = process.argv[otherIn + 1];

let otherOut = process.argv.indexOf('-o');
if (otherOut != -1) outputFilename = process.argv[otherOut + 1];

// Main code
let main = function main() {
  cv.readImage(inputFilename, function(err, im) {
    if (err) throw err;

    console.log("== Bdx Roccade Traffic Analysis ==");

    pixelsColor = {};
    parts = [];
    blocks = [];

    resultMatrix = new cv.Matrix.Zeros(im.width(), im.height());
    calculatedMatrix = new cv.Matrix.Zeros(im.width(), im.height());

    // Determine traffic color of image and transform it
    //  to a grayscale matrix
    console.log("> Reading pixels");
    for (let i = 0; i < im.width(); i++) {
      for (let j = 0; j < im.height(); j++) {
        if (is(GREEN, im.pixel(j, i))) {
          pixelsColor[i + '-' + j] = G_GREEN;
          resultMatrix.set(j, i, G_GREEN);
        }
        else if (is(ORANGE, im.pixel(j, i))) {
          pixelsColor[i + '-' + j] = G_ORANGE;
          resultMatrix.set(j, i, G_ORANGE);
        }
        else if (is(RED, im.pixel(j, i))) {
          pixelsColor[i + '-' + j] = G_RED;
          resultMatrix.set(j, i, G_RED);
        }
        else if (is(BLACK, im.pixel(j, i))) {
          pixelsColor[i + '-' + j] = G_BLACK;
          resultMatrix.set(j, i, G_BLACK);
        }
      }
    }

    if (process.argv.indexOf("--no-parts") != -1) {
      resultMatrix.save(outputFilename);
      return;
    }

    // Create parts for group all pixels
    console.log("> Determine parts of roads");
    for (let i = 0; i < im.width(); i++) {
      for (let j = 0; j < im.height(); j++) {
        if (resultMatrix.get(j, i) > 0) {
          let part = calculatePart(resultMatrix, i, j);

          if (part) {
            part['color'] = determineColorForPart(part, pixelsColor);
            part['center'] = determineCenterForPart(part);
            parts.push(part);
          }
        }
      }
    }

    // let currentValue = 1;
    //
    // console.log("> Determine coordonates colors");
    // console.log("- In :");
    // for (let c of inCoordonates) {
    //   c.color = getColorForNearestPart(parts, c.x, c.y);
    //   console.log("- [" + currentValue + "] : " + c.color);
    //   currentValue++;
    // }
    //
    // currentValue = 1;
    // console.log("- Out :");
    // for (let c of outCoordonates) {
    //   c.color = getColorForNearestPart(parts, c.x, c.y);
    //   console.log("- [" + currentValue + "] : " + c.color);
    //   currentValue++;
    // }

    console.log("> Creating output file");
    // Fill calculatedMatrix with found parts
    let currentPart = 0;
    let entries = [];
    let saves = [];
    let currentDate = Date.now();

    for (let part of parts) {
      let p = new PartEntry();
      p.partNumber = currentPart;
      p.date = currentDate;

      if (part.color === 'orange') {
        p.trafficState = TRAFFIC_ORANGE;
        for (let p of part.pixels) {
          calculatedMatrix.set(p.y, p.x, G_ORANGE);
        }
      }
      else if (part.color === 'green') {
        p.trafficState = TRAFFIC_GREEN;
        for (let p of part.pixels) {
          calculatedMatrix.set(p.y, p.x, G_GREEN);
        }
      }
      else if (part.color === 'red') {
        p.trafficState = TRAFFIC_RED;
        for (let p of part.pixels) {
          calculatedMatrix.set(p.y, p.x, G_RED);
        }
      }
      else {
        p.trafficState = TRAFFIC_BLACK;
        for (let p of part.pixels) {
          calculatedMatrix.set(p.y, p.x, G_BLACK);
        }
      }

      saves.push(function saveEntry(callback) {
        p.save((err, entry) => {
          if (err) console.error(err);
          else entries.push(entry);
          callback();
        });
      });

      currentPart++;
    }

    async.parallel(saves, () => {
      console.log("> " + entries.length + " entries saved on " + parts.length);
    });

    // let cpParts = parts.slice(0);
    //
    // while (cpParts.length > 0) {
    //   let foundParts = searchNeighboursFor(cpParts, cpParts[0]);
    //
    //   let block = {
    //     parts: foundParts
    //   };
    //
    //   blocks.push(block);
    // }
    //
    // console.log(blocks);
    // console.log(parts.length);
    //
    // let currentPart = 0;
    //
    // for (let b of blocks) {
    //   for (let p of b.parts) {
    //     let color = (currentPart * 100) % 256;
    //     if (color > 200) color = (color + 56) % 256;
    //     for (let px of p.pixels)
    //       calculatedMatrix.set(px.y, px.x, color);
    //
    //     calculatedMatrix.set(p.center[1], p.center[0], 255);
    //   }
    //
    //   currentPart++;
    // }

    // console.log(nbOrange);
    // console.log(JSON.stringify(parts[3]));
    // console.log(JSON.stringify(coordonates));

    // Save matrix
    console.log("> Saving ...");
    calculatedMatrix.save(outputFilename);

    console.log("> Done ! Bye bye !");
  })
}

download('http://hackjack.info/rocade/bordeaux/images/', inputFilename, main);

setInterval(() => {
  download('http://hackjack.info/rocade/bordeaux/images/', inputFilename, main)
}, 5000000);
