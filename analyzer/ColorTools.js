'use strict';

// Colors
const GREEN = [0, 255, 0];
const ORANGE = [0, 154, 255];
const RED = [0, 0, 255];
const BLACK = [0, 0, 0];

const G_GREEN = 255;
const G_ORANGE = 192;
const G_RED = 128;
const G_BLACK = 64;

const threshold = 5;

// Check a value around another
function isAround(colorValue, pixelValue) {
  return pixelValue >= colorValue - threshold && pixelValue <= colorValue + threshold;
}

// Test if a pixel is a kind of color
module.exports.is = function is(color, pixel) {
  return isAround(color[0], pixel[0]) && isAround(color[1], pixel[1]) && isAround(color[2], pixel[2]);
}

module.exports.isAround = isAround;
module.exports.const = {GREEN, ORANGE, RED, BLACK, G_GREEN, G_ORANGE, G_RED, G_BLACK};
