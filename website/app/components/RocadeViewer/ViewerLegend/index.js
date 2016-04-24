import React, {Component} from 'react';
import './ViewerLegend.less';

export default class ViewerLegend extends Component {
  render() {
    let legends = [
      {
        name: 'Fluide',
        id: 'legendFluid'
      }, {
        name: 'Dense',
        id: 'legendDense'
      }, {
        name: 'Saturé',
        id: 'legendSaturated'
      }, {
        name: 'Bloqué',
        id: 'legendBlocked'
      }, {
        name: 'Non disponible',
        id: 'legendNotFound'
      }
    ];
    return (
      <div id="c-viewerLegend">
        <div className="title">Légende</div>
        <div className="legends">
          {legends.map(function(e) {
            return (
              <div className="legend" key={e.name}>
                <div id={e.id} className="legendCircle"></div>
                {e.name}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
