import React, {Component} from 'react';
import './InfoBubble.less';

const GREEN = 0;
const ORANGE = 1;
const RED = 2;
const BLACK = 3;

const MS_IN_SECONDES = 1000;
const SECONDES_IN_MINUTES = 60;
const MS_IN_MINUTES = MS_IN_SECONDES * SECONDES_IN_MINUTES;

function dateDifference(d1, d2) {
  return new Date(d2).getTime() - new Date(d1).getTime();
}

export default class InfoBubble extends Component {
  static propTypes = {
    selectionInfos: React.PropTypes.object.isRequired,
    onClose: React.PropTypes.func.isRequired,
    currentDate: React.PropTypes.string.isRequired,
    position: React.PropTypes.object.isRequired
  };

  render() {
    const {selectionInfos, currentDate, position, onClose} = this.props;

    let style = position;

    let traffic = undefined;

    switch (selectionInfos.trafficState) {
      case GREEN:
        traffic = {
          name: 'Fluide',
          id: 'fluid'
        };
        break;
      case ORANGE:
        traffic = {
          name: 'Dense',
          id: 'dense'
        };
        break;
      case RED:
        traffic = {
          name: 'Saturé',
          id: 'saturated'
        };
        break;
      case BLACK:
        traffic = {
          name: 'Bloqué',
          id: 'blocked'
        };
        break;
      default:
        traffic = {
          name: 'Non disponible',
          id: 'notFound'
        };
        break;
    }

    traffic.id += ' stateText';

    if (selectionInfos.beginning !== undefined) {
      if (selectionInfos.beginning !== 0) {
        let d = dateDifference(selectionInfos.beginning, currentDate) / (MS_IN_MINUTES);

        traffic.beginning = ' depuis ' + Math.round(d) + ' minutes';
      } else {
        traffic.beginning = ' (début)';
      }
    }

    let link = 'part/' + selectionInfos.partNumber;

    return (
      <div style={style} id="c-infoBubble">
        Portion n°{selectionInfos.partNumber}
        <div className="description">
          Traffic :&nbsp;
          <span className={traffic.id}>
            {traffic.name}
          </span>

          {traffic.beginning}<br/>

          <a href={link}>Voir l'historique</a>
          <div className="close" onClick={onClose}>Fermer</div>
        </div>
      </div>
    );
  }
}
