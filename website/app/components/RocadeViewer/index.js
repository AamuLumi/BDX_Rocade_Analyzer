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

const CANVAS_PADDING = 40;
const STROKE_WIDTH = 15;
const CIRCLE_RADIUS = 7.5;
const SPREADING_FACTOR = 1.5;

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

function alreadyAdded(part, currentParts) {
  for (let c of currentParts) {
    if (part.partNumber === c.partNumber) {
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
      currentDate: undefined,
      valuesCursor: 0,
      mustRedraw: false,
      lastUpdated: -1
    };
  }

  createPointInPath(path, x, y, color) {
    new paper.Shape.Circle({
      center: [
        x, y
      ],
      fillColor: color,
      radius: CIRCLE_RADIUS
    });

    path.add(new paper.Point(x, y));
  }

  getX(x, minX) {
    return x - minX + CANVAS_PADDING;
  }

  getY(y, minY) {
    return y - minY + CANVAS_PADDING;
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
    }, () => {
      window.addEventListener('resize', (e) => {
        this.handleResize(e);
      });
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', (e) => {
      this.handleResize(e);
    });
  }

  componentDidMount() {}

  componentWillReceiveProps(nextProps) {
    this.props = nextProps;

    let lastUpdated = this.props.data.lastUpdated;

    if (lastUpdated && lastUpdated !== this.state.lastUpdated) {
      this.setState({
        lastUpdated: lastUpdated
      }, () => {
        this.startDraw(true);
      });
    }

    if (!this.state.currentDate) {
      this.startDraw(true);
    }
  }

  startDraw(isFirst) {
    // Setup the first drawing Get canvas and setup paperJs to
    // work on
    let canvas = document.getElementById('rocade-canvas');
    paper.setup(canvas);

    // Prepare the next state of the component
    let nextState = {
      width: paper.view.size.width,
      height: paper.view.size.height,
      mustRedraw: false
    };

    // If this is the first drawing and there's data loaded, add
    // the first date to state
    if (isFirst && this.props.data.parts && this.props.data.parts[0]) {
      nextState.currentDate = this.props.data.parts[0].date;
    }

    // Change state, and start drawing
    this.setState(nextState, () => {
      this.draw();
    });
  }

  draw() {
    // Setup canvas
    let canvas = document.getElementById('rocade-canvas');
    paper.setup(canvas);

    // Clear any datas already drawn
    paper.project.clear();

    // Setup constants
    const {width, height, valuesCursor} = this.state;
    const {minX, maxX, minY, maxY} = Rocade.properties;

    // drawWidth : real width of the drawing
    let drawWidth = (maxX - minX + 2 * CANVAS_PADDING),
      // drawHeight: real height of the drawing
      drawHeight = (maxY - minY + 2 * CANVAS_PADDING),
      // xFactor : ratio of available width and drawing width
      xFactor = width / drawWidth,
      // yFactor : ratio of available height and drawing height
      yFactor = height / drawHeight,
      // factor : contains minimum between xFactor and yFactor
      factor = 0,
      // xPadding : the padding to add to center drawing
      xPadding = 0,
      // yPadding : the padding to add to center drawing
      yPadding = 0;

    // Goal here is to get the smaller ratio, because we want to
    // keep the aspect ratio of drawing. So we need to center
    // the drawing with the available space.
    if (xFactor < yFactor) {
      // For example, we are in the case where there's space
      // vertically available.
      factor = xFactor;
      // So we calculate the padding to add to center the drawing.
      // No need to center horizontally, because xFactor will
      // scale the drawing at the maximum of available space.
      yPadding = (height - factor * drawHeight) / 2;
    } else {
      factor = yFactor;
      xPadding = (width - factor * drawWidth) / 2;
    }

    // Temporary variables
    let x = 0,
      y = 0,
      partNumber = -1,
      trafficState = -1,
      currentPath = 0,
      color = undefined;

    // Get loaded datas
    let currentParts = undefined;

    if (this.props.data && this.props.data.parts[valuesCursor] && this.props.data.parts[valuesCursor].parts) {
      currentParts = this.props.data.parts[valuesCursor].parts;
    }

    // For each "path" (= group of parts)
    for (let current of Rocade.parts) {
      // We create two paths, one for each road
      let pathOne = new paper.Path();
      let pathTwo = new paper.Path();

      // Setup color and width
      pathOne.strokeColor = '#FFF59D';
      pathOne.strokeWidth = STROKE_WIDTH;
      pathTwo.strokeColor = '#E0F7FA';
      pathTwo.strokeWidth = STROKE_WIDTH;

      // For each part of the path
      for (let i = 0; i < current.parts.length; i++) {
        // Get coordonates of the two roads
        let x1 = this.getX(current.parts[i][0].center[0], minX);
        let y1 = this.getY(current.parts[i][0].center[1], minY);
        let x2 = this.getX(current.parts[i][1].center[0], minX);
        let y2 = this.getY(current.parts[i][1].center[1], minY);

        /* Spreading operation
         * We need to spread roads. Initially, roads are more collapsed.
         * To increase readibility, we calculate the vector between
         * the two roads. And we add/substract a product of the vector
         * and a factor.
         */
        let vx = x2 - x1;
        x2 += vx * SPREADING_FACTOR;
        x1 -= vx * SPREADING_FACTOR;

        let vy = y2 - y1;
        y2 += vy * SPREADING_FACTOR;
        y1 -= vy * SPREADING_FACTOR;

        // For each road
        for (let pathToUse = 0; pathToUse < 2; pathToUse++) {
          // We prepare the road and the point to add.
          if (pathToUse === 0) {
            currentPath = pathOne;
            x = factor * x1 + xPadding;
            y = factor * y1 + yPadding;
          } else {
            currentPath = pathTwo;
            x = factor * x2 + xPadding;
            y = factor * y2 + yPadding;
          }

          // If there's loaded parts
          if (currentParts) {
            // Get the partNumber
            partNumber = current.parts[i][pathToUse].partNumber;

            // Determinate the traffic state
            trafficState = getTrafficFor(partNumber, currentParts);

            // Get the equivalent color
            color = getColorForTraffic(trafficState);
          } else {
            // Nothing loaded, so give a "unavailable" color
            color = 'gray';
          }

          // Add point to the path
          this.createPointInPath(currentPath, x, y, color);
        }
      }

      // Smooth paths
      pathOne.smooth();
      pathTwo.smooth();

      // Check if these paths are closed
      if (current.closed) {
        pathOne.closed = true;
        pathTwo.closed = true;
      }
    }

    // Redraw if the state.mustRedraw has been changed during
    // drawing It perform a resize queue
    if (this.state.mustRedraw) {
      this.startDraw(false);
    } else {
      // Nothing to redraw, to update the view
      paper.view.update(true);
    }
  }

  handleResize() {
    this.setState({
      mustRedraw: true
    }, () => {
      this.startDraw(false);
    });
  }

  render() {
    const {data} = this.props;

    return (
      <div id="c-rocadeViewer">
        <canvas id="rocade-canvas" data-paper-resize/>
        <DateSlider
          onChange={(v) => this.changeDate(v)}
          max={data.parts.length - 1}
          initial={0}
          date={this.state.currentDate}/>
      </div>
    );
  }
}

// Connect to the store
const mapStateToProps = (state) => {
  return {data: state.loadParts};
};

export default connect(mapStateToProps)(RocadeViewer);
