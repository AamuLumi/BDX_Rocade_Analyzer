// Algorithm to search a point in the road

let currentValue = 1;

console.log("> Determine coordonates colors");
console.log("- In :");
for (let c of inCoordonates) {
  c.color = getColorForNearestPart(parts, c.x, c.y);
  console.log("- [" + currentValue + "] : " + c.color);
  currentValue++;
}

currentValue = 1;
console.log("- Out :");
for (let c of outCoordonates) {
  c.color = getColorForNearestPart(parts, c.x, c.y);
  console.log("- [" + currentValue + "] : " + c.color);
  currentValue++;
}

// Algorithm to calculate and show blocks of roads

let cpParts = parts.slice(0);

while (cpParts.length > 0) {
  let foundParts = searchNeighboursFor(cpParts, cpParts[0]);

  let block = {
    parts: foundParts
  };

  blocks.push(block);
}

console.log(blocks);
console.log(parts.length);

let currentPart = 0;

for (let b of blocks) {
  for (let p of b.parts) {
    let color = (currentPart * 100) % 256;
    if (color > 200) color = (color + 56) % 256;
    for (let px of p.pixels)
      calculatedMatrix.set(px.y, px.x, color);

    calculatedMatrix.set(p.center[1], p.center[0], 255);
  }

  currentPart++;
}

console.log(nbOrange);
console.log(JSON.stringify(parts[3]));
console.log(JSON.stringify(coordonates));

// Algorithm which search a way on the road

let currentPoint = beg;
let lastBegPoint = beg;
let nbPoints = 0;
let stop = false;
let lastDirection = -1;
let beforeLastDirection = -1;
let beg = [311, 69];
let nbPointsInVector = 10;
let newDirection = UP;
let noPossibility = false;
let nbPointsNo = 0;

let UP = 0;
let DOWN = 1;
let LEFT = 2;
let RIGHT = 3;

let setNewDirection = function(d){
  newDirection = d;
  noPossibility = false;
}

let nbPointsInSameDirection

while (!stop){
  console.log(currentPoint + ' ' + newDirection + ' ' + lastDirection + ' ' + beforeLastDirection + ' ' + noPossibility);
  if (newDirection != lastDirection){
    beforeLastDirection = lastDirection;
    lastDirection = newDirection;
  }
  else {
    nbPointsInSameDirection ++;
  }

  if (lastDirection == UP && resultMatrix.get(currentPoint[1] - 1, currentPoint[0]) > 0){
    currentPoint[1]--;
    setNewDirection(UP);
  }
  else if (lastDirection == RIGHT && resultMatrix.get(currentPoint[1], currentPoint[0] +1) > 0){
    currentPoint[0]++;
    setNewDirection(RIGHT);
  }
  else if (lastDirection == DOWN && resultMatrix.get(currentPoint[1] + 1, currentPoint[0]) > 0){
    currentPoint[1]++;
    setNewDirection(DOWN);
  }
  else if (lastDirection == LEFT && resultMatrix.get(currentPoint[1], currentPoint[0] -1) > 0){
    currentPoint[0]--;
    setNewDirection(LEFT);
  }// Change direction
  else if (lastDirection == UP){
    if ((noPossibility || beforeLastDirection != LEFT) && resultMatrix.get(currentPoint[1], currentPoint[0] +1) > 0){
      currentPoint[0]++;
      setNewDirection(RIGHT);
    }
    else if ((noPossibility || beforeLastDirection != RIGHT) && resultMatrix.get(currentPoint[1], currentPoint[0] -1) > 0){
      currentPoint[0]--;
      setNewDirection(LEFT);
    }
    else if (noPossibility){
      currentPoint[1]++;
      setNewDirection(DOWN);
    }
    else
      noPossibility = true;
  }
  else if (lastDirection == RIGHT){
    if ((noPossibility || beforeLastDirection != DOWN) && resultMatrix.get(currentPoint[1] - 1, currentPoint[0]) > 0){
      currentPoint[1]--;
      setNewDirection(UP);
    }
    else if ((noPossibility || beforeLastDirection != UP) && resultMatrix.get(currentPoint[1] + 1, currentPoint[0]) > 0){
      currentPoint[1]++;
      setNewDirection(DOWN);
    }
    else if (noPossibility){
      currentPoint[0]--;
      setNewDirection(LEFT);
    }
    else
      noPossibility = true;
  }
  else if (lastDirection == DOWN){
    if ((noPossibility || beforeLastDirection != LEFT) && resultMatrix.get(currentPoint[1], currentPoint[0] +1) > 0){
      currentPoint[0]++;
      setNewDirection(RIGHT);
    }
    else if ((noPossibility || beforeLastDirection != RIGHT) && resultMatrix.get(currentPoint[1], currentPoint[0] -1) > 0){
      currentPoint[0]--;
      setNewDirection(LEFT);
    }
    else if (noPossibility){
      currentPoint[1]--;
      setNewDirection(UP);
    }
    else
      noPossibility = true;
  }
  else if (lastDirection == LEFT){
    if ((noPossibility || beforeLastDirection != DOWN) && resultMatrix.get(currentPoint[1] - 1, currentPoint[0]) > 0){
      currentPoint[1]--;
      setNewDirection(UP);
    }
    else if ((noPossibility || beforeLastDirection != UP) && resultMatrix.get(currentPoint[1] + 1, currentPoint[0]) > 0){
      currentPoint[1]++;
      setNewDirection(DOWN);
    }
    else if (noPossibility){
      currentPoint[0]++;
      setNewDirection(RIGHT);
    }
    else
      noPossibility = true;
  }
  else
    noPossibility = true;

  calculatedMatrix.set(currentPoint[1], currentPoint[0], 128);

  if (nbPoints % nbPointsInVector == 0){
    calculatedMatrix.line(lastBegPoint, currentPoint, [255, 255, 255]);
    lastBegPoint = currentPoint;
  }

  if (nbPoints > 1000 && isAround(beg[0], currentPoint[0]) && isAround(beg[1], currentPoint[1]))
    stop = true;

  if (!noPossibility) nbPoints++;
  else nbPointsNo++;

  if (nbPointsNo > 5) stop = true;
}
