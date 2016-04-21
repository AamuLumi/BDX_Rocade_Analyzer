'use strict';

let Rocade = require('./Rocade');
let fs = require('fs');

let i = 0;
let res = {'properties':Rocade.properties};
let arrayRes = [];
let tmp = null;
let tmpArray = [];
let tmpElement = null;
let currentPart = [];
let elementsFound = [];

function exist(e){
  for (let c of elementsFound){
    if (c[0] === e[0] && c[1] === e[1]){
      return true;
    }
  }

  return false;
}

for (let current of Rocade.parts){
  tmp = {'closed' : current.closed};
  tmpArray = [];

  for (let c of current.parts){
    currentPart = [];
    for (let el of c){
      tmpElement = {'center' : el};

      if (!exist(el)){
        tmpElement.id = i++;
        elementsFound.push(el);
      }

      currentPart.push(tmpElement);
    }

    tmpArray.push(currentPart);
  }

  tmp.parts = tmpArray;
  arrayRes.push(tmp);
}

res.parts = arrayRes;

fs.writeFileSync('newRocade.txt', JSON.stringify(res));
