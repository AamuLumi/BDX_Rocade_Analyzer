// Imports
import React, {Component} from 'react';
import {Link} from 'react-router';
import Rocade from '~/conf/Rocade';
import './InfoBubble.less';

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

    let traffic = Rocade.trafficState[selectionInfos.trafficState+1];

    traffic.id = traffic.name + ' stateText';

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
            {traffic.description}
          </span>

          {traffic.beginning}<br/>

          <Link to={link}>Voir l'historique</Link>
          <div className="close" onClick={onClose}>Fermer</div>
        </div>
      </div>
    );
  }
}
