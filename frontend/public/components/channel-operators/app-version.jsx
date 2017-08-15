import React from 'react';
import classNames from 'classnames';

import {LoadingInline, taskStatuses, OperatorState, operatorStates, calculateChannelState, determineOperatorState, orderedTaskStatuses} from '../utils';
import {configureOperatorStrategyModal, configureOperatorChannelModal,} from '../modals';
import {DetailConfig} from './detail-config';
import {DetailStatus} from './detail-status';
import {SafetyFirst} from '../safety-first';

const calculateAppVersionState = (statuses) => {
  const overallState = _(statuses)
    .map('state')
    .uniq();
  return _.find(orderedTaskStatuses, (s) => _.includes(overallState.value(), s));
};

const groupTaskStatuses = (taskStatuses) => {
  if (taskStatuses && taskStatuses.length) {
    const operatorTaskStatuses = {
      name: 'Update Tectonic Operators',
      reason: '',
      state: '',
      //TODO: amrutac This is being implemented in TCO operator and
      //will be returned in the response
      type: 'operator',
      statuses: []
    };

    const appVersionTaskStatuses = {
      name: 'Update AppVersion components',
      reason: '',
      state: '',
      //TODO: amrutac This is being implemented in TCO operator and
      //will be returned in the response
      type: 'appversion',
      statuses: []
    };

    const groupedTaskStatuses = [operatorTaskStatuses, appVersionTaskStatuses];
    _.forEach(taskStatuses, (status) => {
      if (status.name.startsWith('Update deployment')) {
        operatorTaskStatuses.statuses.push(status);
      } else if (status.name.startsWith('Update AppVersion')) {
        //TODO: amrutac This is being implemented in TCO operator
        //and will be returned in the response
        status.type = 'appversion';
        appVersionTaskStatuses.statuses.push(status);
      } else {
        groupedTaskStatuses.push(status);
      }
    });

    //Set status for parent tasks
    operatorTaskStatuses.state = calculateAppVersionState(operatorTaskStatuses.statuses);
    appVersionTaskStatuses.state = calculateAppVersionState(appVersionTaskStatuses.statuses);

    return groupedTaskStatuses;
  }

  return null;
};

const Header = ({channelState, tcAppVersion, expanded, onClick}) => {
  return <div className="co-cluster-updates__heading">
    <div className="co-cluster-updates__heading--name-wrapper">
      <span className="co-cluster-updates__heading--name">Tectonic</span>
      { !expanded && <span className="co-cluster-updates__heading--version">{tcAppVersion.currentVersion}</span> }
    </div>
    { !expanded &&
      <div className="co-cluster-updates__heading--updates">
        <OperatorState opState={channelState} version={tcAppVersion.desiredVersion} />
      </div>
    }
    <a className="co-cluster-updates__toggle" onClick={onClick}>{expanded ? 'Collapse' : 'Expand'}</a>
  </div>;
};

const DetailWrapper = ({title, children}) => {
  return <dl className="co-cluster-updates__detail">
    <dt>{title}</dt>
    <dd>{children}</dd>
  </dl>;
};
DetailWrapper.propTypes = {
  title: React.PropTypes.node,
  children: React.PropTypes.node
};

const Details = ({config, channelState, tcAppVersion}) => {
  if (config.loadError) {
    return <div className="co-cluster-updates__details">
      <DetailWrapper title="Current Version">
        {tcAppVersion.currentVersion || <LoadingInline />}
      </DetailWrapper>
    </div>;
  }

  return <div className="co-cluster-updates__details">
    <DetailWrapper title="Status">
      <DetailStatus config={config} channelState={channelState} version={tcAppVersion.desiredVersion} />
    </DetailWrapper>
    <DetailWrapper title="Current Version">
      {tcAppVersion.currentVersion || <LoadingInline />}
    </DetailWrapper>
    <DetailWrapper title="Channel">
      <DetailConfig config={config} field="channel" modal={configureOperatorChannelModal} displayFunction={_.capitalize} />
    </DetailWrapper>
    <DetailWrapper title="Strategy">
      <DetailConfig config={config} field="automaticUpdate" modal={configureOperatorStrategyModal}
        modalData={{updateAvailable: channelState === 'UpdateAvailable'}}
        displayFunction={(value) => value ? 'Automatic' : 'Admin Approval'} />
    </DetailWrapper>
  </div>;
};

const FailureStatus = ({failureStatus}) => {
  if (!failureStatus) {
    return null;
  }
  const type = _.includes(['Human decision needed', 'Voided warranty'], failureStatus.type) ? 'warning' : 'failed';
  return <div className={`co-cluster-updates__message-box co-cluster-updates__message-box--${type}`}>
    <span>
      {failureStatus.type} : {failureStatus.reason}
    </span>
  </div>;
};

//Component used when the channel-state is UpToDate
class UpToDateTectonicCluster extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDetails: false
    };
  }

  render() {
    const {tcAppVersion, secondaryAppVersions} = this.props;
    const {currentVersion, name} = tcAppVersion;

    return <div className="co-cluster-updates__operator-component col-xs-12">
      <div className="co-cluster-updates__operator-step">
        <div className="co-cluster-updates__operator-icon co-cluster-updates__operator-icon--up-to-date">
          <span className="fa fa-fw fa-check-circle"></span>
        </div>
        <div className="co-cluster-updates__operator-text"> <span>{name} {currentVersion}</span></div>
      </div>
      <div className="co-cluster-updates__operator-details">
        <button className="btn btn-link" onClick={() => this.setState({showDetails: !this.state.showDetails})}>
          {this.state.showDetails ? 'Hide Details' : 'Show Details'}
        </button>

        {this.state.showDetails && <ul className="co-cluster-updates__operator-list">
          {_.map(secondaryAppVersions, (appVersion, index) => <li key={index}>
            <span>{appVersion.name} {appVersion.currentVersion}</span>
          </li>)}
        </ul>}
      </div>
    </div>;
  }
}

UpToDateTectonicCluster.propTypes = {
  tcAppVersion: React.PropTypes.object,
  secondaryAppVersions: React.PropTypes.array,
};

//Component used when updates are available or in progress.
class TectonicClusterAppVersion extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDetails: false
    };
  }

  render() {
    const {tcAppVersion, secondaryAppVersions, tectonicVersions} = this.props;
    const {currentVersion, targetVersion, logsUrl, name} = tcAppVersion;
    let desiredVersion = tcAppVersion.desiredVersion;

    const headerText = currentVersion === desiredVersion ? <span>{name} {currentVersion}</span> :
      <span className="co-cluster-updates__operator-subheader">{name} {currentVersion} &#10141; {desiredVersion || targetVersion}</span>;

    const state = determineOperatorState(_.defaults({desiredVersion: desiredVersion}, tcAppVersion));
    const groupedTaskStatuses = groupTaskStatuses(tcAppVersion.taskStatuses);

    return <div className="co-cluster-updates__operator-component col-xs-12">
      <div className="co-cluster-updates__operator-step">
        {(state === 'Complete' || state === 'Pending') && <div className={`co-cluster-updates__operator-icon co-cluster-updates__operator-icon--${ _.get(operatorStates[state], 'suffix', '')}`}>
          <span className={classNames('fa fa-fw', _.get(operatorStates[state], 'icon'))}></span>
        </div>}
        <div className="co-cluster-updates__operator-text">{headerText}</div>
      </div>

      {groupedTaskStatuses &&
        <button className="btn btn-link co-cluster-updates__operator-show-details" onClick={() => this.setState({showDetails: !this.state.showDetails})}>
          {this.state.showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      }

      {this.state.showDetails && <div>
        <div className="co-cluster-updates__operator-logs">
          <a className="co-cluster-updates__breakdown-button btn btn-default" href={logsUrl} target="_blank">View Logs</a>
        </div>
        {groupedTaskStatuses && _.map(groupedTaskStatuses, (taskStatus, index) => <TaskStatus taskStatus={taskStatus} key={index} isTCAppVersion={true} secondaryAppVersions={secondaryAppVersions} showDetails={this.state.showDetails}
          tcAppVersion={tcAppVersion}
          tectonicVersions={tectonicVersions} />
        )}
      </div>}
    </div>;
  }
}

TectonicClusterAppVersion.propTypes = {
  tcAppVersion: React.PropTypes.object,
  secondaryAppVersions: React.PropTypes.array,
  tectonicVersions: React.PropTypes.object,
};

const SecondaryAppVersion = ({appVersion, tcAppVersion, tectonicVersions}) => {
  const {key, currentVersion, targetVersion, logsUrl, name} = appVersion;
  let desiredVersion = appVersion.desiredVersion;

  if (tcAppVersion.currentVersion !== tcAppVersion.desiredVersion && tectonicVersions.version === tcAppVersion.desiredVersion) {
    const latestDesiredVersion = _.find(tectonicVersions.desiredVersions, (v) => v.name === key);
    if (latestDesiredVersion) {
      desiredVersion = latestDesiredVersion.version;
    }
  }

  const state = determineOperatorState(_.defaults({desiredVersion: desiredVersion}, appVersion));

  return <div className="co-cluster-updates__operator-component">
    <div className="co-cluster-updates__operator-step">
      {(state === 'Complete' || state === 'Pending') && <div className={`co-cluster-updates__operator-icon co-cluster-updates__operator-icon--${_.get(operatorStates[state], 'suffix', '')}`}>
        <span className={classNames('fa fa-fw', _.get(operatorStates[state], 'icon'))}></span>
      </div>}
      <div className="co-cluster-updates__operator-text">
        <span className="co-cluster-updates__operator-subheader">
          {name} {currentVersion} &#10141; {desiredVersion || targetVersion}
        </span>
      </div>
    </div>
    {state !== 'Complete' && logsUrl && <div className="co-cluster-updates__operator-logs"><a className="co-cluster-updates__breakdown-button btn btn-default" href={logsUrl} target="_blank">View Logs</a></div>}
    {_.map(appVersion.taskStatuses, (taskStatus, index) =>
      <TaskStatus taskStatus={taskStatus} key={index} isTCAppVersion={false} /> )
    }
  </div>;
};
SecondaryAppVersion.propTypes = {
  component: React.PropTypes.object,
};

const TaskStatusStep = ({status, style}) => {
  const {name, state} = status;
  const suffix = _.get(taskStatuses[state], 'suffix', '');
  const icon = _.get(taskStatuses[state], 'icon');

  return <div className="co-cluster-updates__operator-ts-step" style={style}>
    <div className={`co-cluster-updates__operator-icon co-cluster-updates__operator-ts--${suffix}`}>
      <span className={classNames('fa fa-fw', icon)}></span>
    </div>
    <div className={(!_.has(status, 'statuses') && status.type === 'appversion' && status.state === 'Running') ? 'co-cluster-updates__operator-text co-cluster-updates__operator-text--running' : 'co-cluster-updates__operator-text'}>
      {name}
    </div>
  </div>;
};

class TaskStatus extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isErrorMsgVisible: false
    };
  }

  render() {
    const {taskStatus, isTCAppVersion, secondaryAppVersions, tcAppVersion} = this.props;
    const reason = taskStatus.reason;
    return <div className="co-cluster-updates__operator-ts-component row">
      <div className={taskStatus.type === 'appversion' ? 'co-cluster-updates__appversion-ts col-xs-6' : 'col-xs-6'}>
        <TaskStatusStep status={taskStatus} style={{paddingBottom: '10px'}} />

        {!_.isEmpty(_.get(taskStatus, 'statuses')) && this.props.showDetails && taskStatus.state === 'Completed' &&
          _.map(taskStatus.statuses, (status, index) =>
            <TaskStatusStep status={status} key={index} style={{padding: '0 0 10px 20px'}}/>)
        }

        {reason && !isTCAppVersion &&
          <div className="co-cluster-updates__operator-ts-error-msg-link">
            <a onClick={() => {
              this.setState({isErrorMsgVisible: !this.state.isErrorMsgVisible});
            }}>
              {this.state.isErrorMsgVisible ? 'Hide Failed Reason' : 'Show Failed Reason'}
            </a>
          </div>
        }
        {reason && !isTCAppVersion && this.state.isErrorMsgVisible &&
          <div className="co-cluster-updates__operator-ts-error-msg">{reason}</div> }
      </div>

      {taskStatus.type === 'appversion' && <div className="col-xs-6 co-cluster-updates__sec-appversion-ts">
        {_.map(secondaryAppVersions, (appVersion, index) => {
          return (!_.isEmpty(_.get(appVersion, 'taskStatuses'))) ?
            <SecondaryAppVersion
              appVersion={appVersion}
              key={index}
              tectonicVersions={this.props.tectonicVersions}
              tcAppVersion={tcAppVersion} /> :
            null;
        })
        }
      </div>}
    </div>;
  }
}

TaskStatus.propTypes = {
  taskStatus: React.PropTypes.object,
  isTCAppVersion: React.PropTypes.bool,
  tcAppVersion: React.PropTypes.object,
  secondaryAppVersions: React.PropTypes.array,
  tectonicVersions: React.PropTypes.object,
};

//Displays details about Channel Operators
//Primary operator is Tectonic Channel Operator
export class AppVersionDetails extends SafetyFirst{
  constructor(props) {
    super(props);
    this._toggleExpand = this._toggleExpand.bind(this);
    this.state = {
      expanded: false
    };
  }

  _toggleExpand(event) {
    event.preventDefault();
    this.setState({
      expanded: !this.state.expanded
    });
    event.target.blur();
  }

  render() {
    const {primaryOperatorName, appVersionList, config} = this.props;
    const tcAppVersion = _.get(appVersionList, primaryOperatorName, {});
    const operators = Object.keys(appVersionList).reduce((ops, key) => {
      ops.push(appVersionList[key]);
      return ops;
    }, []);

    const secondaryAppVersions = Object.keys(appVersionList).reduce((ops, key) => {
      if (key !== primaryOperatorName) {
        ops.push(appVersionList[key]);
      }
      return ops;
    }, []);
    const channelState = appVersionList.length === 0 ? 'Loading' : calculateChannelState(operators, tcAppVersion, config);

    return <div>
      <Header channelState={channelState}
        tcAppVersion={tcAppVersion}
        expanded={this.state.expanded}
        onClick={this._toggleExpand} />
      { this.state.expanded &&
        <div>
          <Details config={config}
            channelState={channelState}
            tcAppVersion={tcAppVersion} />
          <FailureStatus failureStatus={tcAppVersion.failureStatus} />
          <div className="co-cluster-updates__operator">
            {tcAppVersion && channelState === 'UpToDate' &&
              <UpToDateTectonicCluster
                tcAppVersion={tcAppVersion}
                secondaryAppVersions={secondaryAppVersions}
              />
            }
            {tcAppVersion && channelState !== 'UpToDate' &&
              <TectonicClusterAppVersion
                tcAppVersion={tcAppVersion}
                secondaryAppVersions={secondaryAppVersions}
                tectonicVersions={this.props.tectonicVersions}
              />
            }
          </div>
        </div>
      }
    </div>;
  }
}

AppVersionDetails.propTypes = {
  primaryOperatorName: React.PropTypes.string,
  config: React.PropTypes.object,
  appVersionList: React.PropTypes.object,
};
