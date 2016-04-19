/* global paper */

import React, {Component} from 'react';
import {connect} from 'react-redux';
import Rocade from './Rocade';
import DateSlider from './DateSlider';
import './RocadeViewer.less';

const GREEN = 0;
const ORANGE = 1;
const RED = 2;
const BLACK = 3;

const NOT_FOUND = -1;

const padding = 40;
const strokeWidth = 15;
const circleRadius = 7.5;
const spreadingFactor = 1.5;

function getColorForTraffic(c) {
  switch (c) {
    case GREEN:
      return '#2196F3';
    case ORANGE:
      return '#FB8C00';
    case RED:
      return '#F44336';
    case BLACK:
      return 'black';
    default:
      return '#EEEEEE';
  }
}

function getTrafficFor(partNumber, partsArray) {
  for (let p of partsArray) {
    if (p.partNumber === partNumber) {
      return p.trafficState;
    }
  }

  return NOT_FOUND;
}

function alreadyAdded(part, currentParts){
  for (let c of currentParts){
    if (part.partNumber === c.partNumber){
      return c.center;
    }
  }

  return undefined;
}

class RocadeViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 0,
      height: 0,
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      currentDate: undefined,
      valuesCursor: 0
    };
  }

  createPointInPath(path, x, y, color) {
    new paper.Shape.Circle({
      center: [
        x, y
      ],
      fillColor: color,
      radius: circleRadius
    });

    path.add(new paper.Point(x, y));
  }

  getX(x) {
    return x - this.state.minX + padding;
  }

  getY(y) {
    return y - this.state.minY + padding;
  }

  changeDate(value) {
    let nextState = {
      valuesCursor: value
    };

    if (this.props.data.parts && this.props.data.parts[value]) {
      nextState.currentDate = this.props.data.parts[value].date;
    }

    this.setState(nextState, () => {
      this.draw();
    });
  }

  componentWillMount() {
    this.setState({
      ...Rocade.properties
    });
  }

  componentDidMount() {}

  componentWillReceiveProps(nextProps) {
    this.props = nextProps;

    if (!this.state.currentDate) {
      this.firstDraw();
      window.addEventListener('resize', (e) => {
        this.handleResize(e);
      });
    }
  }

  firstDraw() {
    let canvas = document.getElementById('rocade-canvas');
    paper.setup(canvas);

    let width = paper.view.size.width;
    let height = paper.view.size.height;

    let nextState = {
      width: width,
      height: height
    };

    if (this.props.data.parts && this.props.data.parts[0]) {
      nextState.currentDate = this.props.data.parts[0].date;
    }

    this.setState(nextState, () => {
      this.draw();
    });
  }

  redraw() {
    let canvas = document.getElementById('rocade-canvas');
    paper.setup(canvas);

    let width = paper.view.size.width;
    let height = paper.view.size.height;

    this.setState({
      width: width,
      height: height
    }, () => {
      this.draw();
    });
  }

  draw() {
    let canvas = document.getElementById('rocade-canvas');
    paper.setup(canvas);

    const {
      width,
      height,
      minX,
      maxX,
      minY,
      maxY,
      valuesCursor
    } = this.state;

    let currentParts = undefined;

    if (this.props.data && this.props.data.parts[this.state.valuesCursor] && this.props.data.parts[this.state.valuesCursor].parts) {
      currentParts = this.props.data.parts[this.state.valuesCursor].parts;
    }

    let drawWidth = (maxX - minX + 2 * padding);
    let drawHeight = (maxY - minY + 2 * padding);

    let xFactor = width / drawWidth;
    let yFactor = height / drawHeight;

    let factor = 0;
    let xPadding = 0;
    let yPadding = 0;

    if (xFactor < yFactor) {
      factor = xFactor;
      yPadding = (height - factor * drawHeight) / 2;
    } else {
      factor = yFactor;
      xPadding = (width - factor * drawWidth) / 2;
    }

    let x = 0,
      y = 0,
      partNumber = -1,
      currentPath = 0,
      color = undefined;

    let addedPoints = [];

    for (let current of Rocade.parts) {
      let pathOne = new paper.Path();
      let pathTwo = new paper.Path();

      pathOne.strokeColor = '#FFF59D';
      pathOne.strokeWidth = strokeWidth;
      pathTwo.strokeColor = '#E0F7FA';
      pathTwo.strokeWidth = strokeWidth;

      for (let i = 0; i < current.parts.length; i++) {
        if (alreadyAdded(current.parts[i][0], addedPoints)){
          let p = alreadyAdded(current.parts[i][0], addedPoints);
          this.createPointInPath(currentPath, p[0], p[1], 'yellow');
          p = alreadyAdded(current.parts[i][1], addedPoints);
          this.createPointInPath(currentPath, p[0], p[1], 'yellow');
        } else {
          let x1 = this.getX(current.parts[i][0].center[0]);
          let y1 = this.getY(current.parts[i][0].center[1]);
          let x2 = this.getX(current.parts[i][1].center[0]);
          let y2 = this.getY(current.parts[i][1].center[1]);

          let vx = x2-x1;
            x2 += vx * spreadingFactor;
            x1 -= vx * spreadingFactor;

          let vy = y2-y1;
            y2 += vy * spreadingFactor;
            y1 -= vy * spreadingFactor;

          for (let pathToUse = 0; pathToUse < 2; pathToUse++) {
            if (pathToUse === 0) {
              currentPath = pathOne;
              x = factor * x1 + xPadding;
              y = factor * y1 + yPadding;
            } else {
              currentPath = pathTwo;
              x = factor * x2 + xPadding;
              y = factor * y2 + yPadding;
            }

            if (currentParts) {
              partNumber = getTrafficFor(current.parts[i][pathToUse].partNumber, currentParts);
              color = getColorForTraffic(partNumber);
            } else {
              color = 'gray';
            }
            this.createPointInPath(currentPath, x, y, color);

            addedPoints.push({partNumber : partNumber, center : [x, y]});
          }
        }

      }

      pathOne.smooth();
      pathTwo.smooth();

      if (current.closed) {
        pathOne.closed = true;
        pathTwo.closed = true;
      }
    }

    // render
    paper.view.draw();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', (e) => {
      this.handleResize(e);
    });
  }

  handleResize() {
    this.redraw();
  }

  render() {
    const {data} = this.props;

    return (
      <div id="c-rocadeViewer">
        <canvas id="rocade-canvas" data-paper-resize/>
        <DateSlider
          onChange={this.changeDate.bind(this)}
          max={data.parts.length - 1}
          initial={0}
          date={this.state.currentDate}/>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {data: state.loadParts};
};

export default connect(mapStateToProps)(RocadeViewer);
