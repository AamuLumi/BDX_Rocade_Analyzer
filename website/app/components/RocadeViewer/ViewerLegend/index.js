import React, {Component} from 'react';
import Rocade from '~/conf/Rocade';
import './ViewerLegend.less';

export default class ViewerLegend extends Component {
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
                  'background-color': e.color
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
