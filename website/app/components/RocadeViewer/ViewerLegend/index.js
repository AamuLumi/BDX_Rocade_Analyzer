// Imports
import React, {Component} from 'react';
import Rocade from '~/conf/Rocade';
import './ViewerLegend.less';

export default class ViewerLegend extends Component {
  /**
   * Render the component
   * @return {Object} the component
   */
  render() {
    return (
      <div id="c-viewerLegend">
        <div className="title">Légende</div>
        <div className="legends">
          {Rocade.trafficState.map(function(e) {
            return (
              <div className="legend" key={e.id}>
                <div
                  className="legendCircle"
                  style={{
                  'backgroundColor': e.color
                }}></div>
              {e.description}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
