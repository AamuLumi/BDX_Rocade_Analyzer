/* global paper */

// Imports
import React, {Component} from 'react';
import {connect} from 'react-redux';
import Rocade from './Rocade';
import DateSlider from './DateSlider';
import ViewerLegend from './ViewerLegend';
import InfoBubble from './InfoBubble';
import './RocadeViewer.less';

// Constants for color associated to traffic
const GREEN = 0;
const ORANGE = 1;
const RED = 2;
const BLACK = 3;

// Constants for not found value in search functions
const NOT_FOUND = -1;

// Drawing constants
const CANVAS_PADDING = 40;
const STROKE_WIDTH = 15;
const CIRCLE_RADIUS = 7.5;
const SPREADING_FACTOR = 1.5;
const SELECTION_RADIUS = CIRCLE_RADIUS * 2;
const SELECTION_STROKE_COLOR = 'black';
const SELECTION_STROKE_WIDTH = 3;
const PADDING_INFOS = 15;

// Constants for startDraw()
const FULL_REDRAW = true;
const PARTIAL_REDRAW = false;

// Constants for paper.view.update()
const FORCE_PAPER_REDRAW = true;
const NO_FORCE_PAPER_REDRAW = false;

// Layers constants
const LAYER_PARTS = 0;
const LAYER_SELECTION = 1;

/**
 * Get CSS color for a specific traffic state
 * @param  {Integer} t the state of the traffic
 * @return {String}   the CSS color
 */
function getColorForTraffic(t) {
  switch (t) {
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

/**
 * Get the traffic state for a specific part in array of parts
 * @param  {Integer} partNumber the part to find
 * @param  {Array} partsArray the array of parts
 * @return {Integer}            the traffic of the part
 */
function getTrafficFor(partNumber, partsArray) {
  for (let p of partsArray) {
    if (p.partNumber === partNumber) {
      return p.trafficState;
    }
  }

  return NOT_FOUND;
}

/**
 * Compute the X coordonate for the canvas
 * It's used to remove the offset in initial coordonates (Rocade.js),
 * 	and add a padding
 * @param  {Integer} x    the X coordonate
 * @param  {Integer} minX the minimal X coordonate in parts
 * @return {Integer}      the translated coordonate
 */
function getX(x, minX) {
  return x - minX + CANVAS_PADDING;
}

/**
 * Compute the Y coordonate for the canvas
 * It's used to remove the offset in initial coordonates (Rocade.js),
 * 	and add a padding
 * @param  {Integer} y    the Y coordonate
 * @param  {Integer} minX the minimal Y coordonate in parts
 * @return {Integer}      the translated coordonate
 */
function getY(y, minY) {
  return y - minY + CANVAS_PADDING;
}

/**
 * Create a new Circle in the canvas
 * @param  {Integer} x      x position of center
 * @param  {Integer} y      y position of center
 * @param  {String} color  CSS fill color
 * @param  {Float} radius the radius of the Circle
 * @return {paper.Shape}        the created Circle
 */
function createCircle(x, y, color, radius) {
  return new paper.Shape.Circle({
    center: [
      x, y
    ],
    fillColor: color,
    radius: radius
  });
}

/**
 * Create a new point in a map path
 * @param  {paper.Path} path  the path which will contain the new point
 * @param  {Integer} x     x position of the center of the point
 * @param  {Integer} y     y position of the center of the point
 * @param  {String} color CSS fill color
 */
function createPointInPath(path, x, y, color) {
  // Create the circle which represent the point
  createCircle(x, y, color, CIRCLE_RADIUS);

  // Add the corresponding point to the path
  path.add(new paper.Point(x, y));
}

/**
 * Determine if a value is between two others
 * @param  {Integer} i   the value to test
 * @param  {Integer} min the min value of interval
 * @param  {Integer} max the max value of interval
 * @return {Boolean}     true if is contained, false else
 */
function between(i, min, max) {
  return i >= min && i <= max;
}

class RocadeViewer extends Component {
  /**
   * Constructor of RocadeViewer
   * @param  {Array} props initial props of the component
   */
  constructor(props) {
    super(props);

    // Setup initial state (ES6 style for setInitialState())
    this.state = {
      // Width of the canvas
      width: 0,
      // Height of the canvas
      height: 0,

      // Current showed date
      currentDate: undefined,

      // Cursor for the data.parts array
      valuesCursor: 0,

      // Boolean to ask a redraw of canvas
      mustRedraw: false,

      // Date of last data refresh
      lastUpdated: -1,

      // Array with all drawn points on the screen
      drawnPoints: [],

      // paper.Shape.Circle which represents selection
      selection: undefined,
      // Additional informations on selection (trafficState,
      // partNumber, ...)
      selectionInfos: undefined
    };
  }

  /***************************************************
   * 						COMPONENT METHODS                    *
   ***************************************************/

  /**
   * Before mounting of component
   */
  componentWillMount() {
    // Setup initial state with the Rocade values
    this.setState({
      ...Rocade.properties
    }, () => {
      // Add a listener on window to call a resize of canvas
      window.addEventListener('resize', (e) => {
        this.handleResize(e);
      });

      // Setup mouse interaction with canvas
      this.setupMouse();
    });
  }

  /**
   * When component receive new props
   * This function is called when store received new parts data.
   * @param  {Array} nextProps new props of component
   */
  componentWillReceiveProps(nextProps) {
    // Refresh props
    this.props = nextProps;

    // Set the lastUpdated state
    let lastUpdated = this.props.data.lastUpdated;

    // If there's data and this is différent from last loaded
    // datas
    if (lastUpdated && lastUpdated !== this.state.lastUpdated) {
      // Setup the date slider to the first value
      this.refs.dateSlider.setValue(0);

      // Compute the next state of component
      let nextState = {
        lastUpdated: lastUpdated,
        valuesCursor: 0
      };

      // If there's parts in data
      if (this.props.data.parts.length <= 0) {
        // Setup something to say no date is found
        nextState.currentDate = undefined;
      }

      // Set new state, and re-draw after
      this.setState(nextState, () => {
        this.startDraw(FULL_REDRAW);
      });
    }
  }

  /**
   * When the component will be unmounted
   */
  componentWillUnmount() {
    // Remove listeners
    window.removeEventListener('resize', (e) => {
      this.handleResize(e);
    });
  }

  /**
   * Called when the window is resized
   */
  handleResize() {
    // Change state to call a signal a new redraw
    this.setState({
      mustRedraw: true
    }, () => {
      // Redraw the canvas
      this.startDraw(PARTIAL_REDRAW);
      // Re-render the component
      this.render();
    });
  }

  /**
   * Setup mouse interactions with canvas
   */
  setupMouse() {
    // Create a new paper.Tool which will contain interactions
    let tool = new paper.Tool();

    // On mouse down, update the selection
    tool.onMouseDown = (event) => {
      this.updateSelection(event.point);
    };

    // Activate the tool
    tool.activate();
  }

  /***************************************************
   * 						DATA SEARCH METHODS                  *
   ***************************************************/

  /**
    * Search the beginning of the traffic state for a part,
    * 	until the current loaded parts.
    * @param  {Object} p the part to search
    * @return {Date}   the since date, 0 if traffic state begins
    */
  getBeginningOf(p) {
    const {valuesCursor} = this.state;
    const {data} = this.props;

    let lastTime = 0;

    // Check parameters and datas We don't do this if we are on
    // the first datas (useless)
    if (!data || !data.parts || valuesCursor <= 0) {
      return 0;
    }

    // For each datas until the first
    for (let c = valuesCursor - 1; c >= 0; c--) {
      // For each part
      for (let part of data.parts[c].parts) {
        // If it's the good part
        if (part.partNumber === p.partNumber) {
          // If it has the same traffic state -> memorize date
          if (part.trafficState === p.trafficState) {
            lastTime = data.parts[c]._id;
          } else {
            // Else it's a differente traffic state, so return the last
            // time  where traffic was the same
            return lastTime;
          }
          // No need to iterate more parts when we have found the good
          // part
          break;
        }
      }
    }

    return lastTime;
  }

  /**
   * Search a currently drawn point
   * @param  {Object} point an object with x and y coordonates of point to find
   * @return {Object}       the corresponding point, undefined if not found
   */
  findDrawnPoint(point) {
    let drawnPoints = this.state.drawnPoints;

    // If there's no data or parameter is invalid
    if (!drawnPoints || !point) {
      return undefined;
    }

    // For each drawn point
    for (let p of drawnPoints) {
      // If x is corresponding and y is corresponding
      if (between(point.x, p.x - CIRCLE_RADIUS, p.x + CIRCLE_RADIUS) && between(point.y, p.y - CIRCLE_RADIUS, p.y + CIRCLE_RADIUS)) {
        return p;
      }
    }

    return undefined;
  }

  /***************************************************
   * 						UPDATE METHODS                       *
   ***************************************************/

  /**
   * Change the date of loaded parts, with changing the cursor
   * @param  {Integer} value the new cursor on the parts array
   */
  changeDate(value) {
    // Setup new state
    let nextState = {
      valuesCursor: value
    };

    // If there's parts and there's the good part
    if (this.props.data.parts && this.props.data.parts[value]) {
      nextState.currentDate = this.props.data.parts[value]._id;
    }

    this.setState(nextState, () => {
      // Redraw after updating date and cursor
      this.draw(PARTIAL_REDRAW);
    });
  }

  /***************************************************
   * 						PAPERJS METHODS                      *
   ***************************************************/

  /**
   * Change the current working layer
   * @param  {Integer} n the id of new layer
   */
  changeCurrentLayer(n) {
    // If layer doesn't exist
    if (!paper.project.layers[n]) {
      // Create layers until we reached the good id
      while (!paper.project.layers[n]) {
        new paper.Layer();
      }
    } else { // If exists, activate it
      paper.project.layers[n].activate;
    }
  }

  /***************************************************
   * 						DRAW PARTS METHODS                   *
   ***************************************************/

  /**
    * Setup a new drawing, and called draw after
    * @param  {Boolean} isFirst true if needs a full redraw (for example,
    *  when we draw for the first time)
    */
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

    // Make a variable to short access
    let data = this.props.data;

    // If this is the first drawing and there's data loaded, add
    // the first date to state
    if (isFirst && data.parts && data.parts[0]) {
      nextState.currentDate = data.parts[0]._id;
    }

    // Change state, and start drawing
    this.setState(nextState, () => {
      this.draw();
    });
  }

  /**
   * Draw the parts map
   */
  draw() {
    // Setup canvas
    let canvas = document.getElementById('rocade-canvas');
    paper.setup(canvas);

    // Make a variable to short access
    let data = this.props.data;

    // Array to store drawn points
    let drawnPoints = [];

    // Clear any datas already drawn
    paper.project.clear();

    // Setup the good layer
    this.changeCurrentLayer(LAYER_PARTS);

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

    if (data && data.parts[valuesCursor] && data.parts[valuesCursor].parts) {
      currentParts = data.parts[valuesCursor].parts;
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
        let x1 = getX(current.parts[i][0].center[0], minX);
        let y1 = getY(current.parts[i][0].center[1], minY);
        let x2 = getX(current.parts[i][1].center[0], minX);
        let y2 = getY(current.parts[i][1].center[1], minY);

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

          // Store point in a structure
          drawnPoints.push({x: x, y: y, partNumber: partNumber, trafficState: trafficState});

          // Add point to the path
          createPointInPath(currentPath, x, y, color);
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
      paper.view.update(FORCE_PAPER_REDRAW);

      // Update drawnPoints
      this.setState({
        drawnPoints: drawnPoints
      }, () => {
        // Update the selection with new points
        this.updateSelection(this.state.selectionInfos);
      });
    }
  }

  /***************************************************
   * 						DRAW SELECTION METHODS               *
   ***************************************************/

  /**
   * Create and/or update the selected part
   * @param  {Object} point an object with x value and y value
   */
  updateSelection(point) {
    // Searched the point
    let p = this.findDrawnPoint(point);

    // If not found, stop the function
    if (!p) {
      return;
    }

    // Clean last selection
    this.cleanSelection();

    // Go to the selection layer
    this.changeCurrentLayer(LAYER_SELECTION);

    // Create the selection
    let selection = createCircle(p.x, p.y, getColorForTraffic(p.trafficState), SELECTION_RADIUS);
    selection.strokeColor = SELECTION_STROKE_COLOR;
    selection.strokeWidth = SELECTION_STROKE_WIDTH;

    // Searched beginning of the traffic state for this point
    let beginning = this.getBeginningOf(p);
    // Add it to point informations
    p.beginning = beginning;

    // Call an update
    paper.view.update(FORCE_PAPER_REDRAW);

    // Setup the new state with selection values
    this.setState({selection: selection, selectionInfos: p});
  }

  /**
   * Clean any existing selection
   */
  cleanSelection() {
    // Go on the selection layer
    this.changeCurrentLayer(LAYER_SELECTION);

    // Remove all on the layer
    paper.project.activeLayer.removeChildren();

    // Update the canvas
    paper.view.update(FORCE_PAPER_REDRAW);

    // Clean selection in state
    this.setState({
      selection: undefined,
      selectionInfos: undefined
    });
  }

  /***************************************************
   * 						RENDER METHODS                       *
   ***************************************************/

  /**
   * Compute position of the InfoBubble component
   * @return {Object} position of the bubble
   */
  getInfosPosition() {
    // Get real position of the body
    let bodyPosition = document.body.getBoundingClientRect();

    // Get the canvas
    let canvas = document.getElementById('rocade-canvas');

    // If no canvas, stop function
    if (!canvas) {
      return;
    }

    // Get real position of the canvas
    let canvasPosition = canvas.getBoundingClientRect();

    // Constants
    const {width, height, selectionInfos} = this.state;
    const halfWidth = width / 2,
      halfHeight = height / 2;

    // Variable which contains the result
    let res = {};

    // If selected point is in the up part of the canvas
    if (selectionInfos.y < halfHeight) {
      // Compute the bubble to be under the point
      res.top = selectionInfos.y + canvasPosition.top + PADDING_INFOS;
    } else { // Else selected point is in the bottom part
      // So compute the bubble to be above the point
      res.bottom = bodyPosition.bottom - canvasPosition.top - selectionInfos.y + PADDING_INFOS;
    }

    // If selected point is in the left part of the canvas
    if (selectionInfos.x < halfWidth) {
      // Compute the bubble to be right of the point
      res.left = selectionInfos.x + canvasPosition.left + PADDING_INFOS;
    } else { // Else selection is in the right part
      // So compute the bubble to be left of the point
      res.right = bodyPosition.right - selectionInfos.x - canvasPosition.left + PADDING_INFOS;
    }

    return res;
  }

  /**
   * Render the component
   * @return {Object} the component
   */
  render() {
    const {data} = this.props;
    const {currentDate, selectionInfos} = this.state;

    let infoBubble = undefined;

    // If there's a selection, compute InfoBubble
    if (selectionInfos) {
      infoBubble = <InfoBubble
        onClose={() => this.cleanSelection()}
        selectionInfos={selectionInfos}
        currentDate={currentDate}
        position={this.getInfosPosition()}/>;
    }

    return (
      <div id="c-rocadeViewer">
        <canvas id="rocade-canvas" data-paper-resize/> {infoBubble}

        <div id="rocadeInfos">
          <DateSlider
            onChange={(v) => this.changeDate(v)}
            max={data.parts.length - 1}
            initial={0}
            ref="dateSlider"
            date={currentDate}/>
          <ViewerLegend/>
        </div>

      </div>
    );
  }
}

// Connect to the store
const mapStateToProps = (state) => {
  return {data: state.loadParts};
};

export default connect(mapStateToProps)(RocadeViewer);
