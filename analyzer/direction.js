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
