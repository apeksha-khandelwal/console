// TODO (jon) - Remove mock code from this file once cluster update feature is complete

/* eslint-disable no-unused-vars, no-undef */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Button } from 'patternfly-react';
import { Link } from 'react-router-dom';

import { ClusterVersionKind, K8sResourceKind, referenceForModel } from '../../module/k8s';
import { ClusterAutoscalerModel, ClusterVersionModel } from '../../models';
import { ClusterOperatorPage } from './cluster-operator';
import { clusterChannelModal, clusterUpdateModal } from '../modals';
import { GlobalConfigPage } from './global-config';
import {
  EmptyBox,
  Firehose,
  HorizontalNav,
  ResourceLink,
  resourcePathFromModel,
  SectionHeading,
  Timestamp,
} from '../utils';

enum ClusterUpdateStatus {
  UpToDate = 'Up to Date',
  UpdatesAvailable = 'Updates Available',
  Updating = 'Updating',
  Failing = 'Failing',
  ErrorRetrieving = 'Error Retrieving',
}

const clusterAutoscalerReference = referenceForModel(ClusterAutoscalerModel);
export const clusterVersionReference = referenceForModel(ClusterVersionModel);

export const getAvailableClusterChannels = () => ({'nightly-4.0': 'nightly-4.0', 'pre-release-4.0': 'pre-release-4.0', 'stable-4.0': 'stable-4.0'});

export const getAvailableClusterUpdates = (cv: ClusterVersionKind) => {
  return _.get(cv, 'status.availableUpdates');
};

export const getDesiredClusterVersion = (cv: ClusterVersionKind) => {
  return _.get(cv, 'status.desired.version');
};

const launchUpdateModal = (cv: ClusterVersionKind) => {
  clusterUpdateModal({cv});
};

const CurrentChannel: React.SFC<CurrentChannelProps> = ({cv}) => <button className="btn btn-link co-m-modal-link" onClick={() => (clusterChannelModal({cv}))}>
  {cv.spec.channel || '-'}
</button>;

const getClusterUpdateStatus = (cv: ClusterVersionKind): ClusterUpdateStatus => {
  const conditions = _.get(cv, 'status.conditions', []);
  const isFailingCondition = _.find(conditions, { type: 'Failing', status: 'True' });
  if (isFailingCondition) {
    return ClusterUpdateStatus.Failing;
  }

  const retrievedUpdatesFailedCondition = _.find(conditions, { type: 'RetrievedUpdates', status: 'False' });
  if (retrievedUpdatesFailedCondition) {
    return ClusterUpdateStatus.ErrorRetrieving;
  }

  const isProgressingCondition = _.find(conditions, { type: 'Progressing', status: 'True' });
  if (isProgressingCondition) {
    return ClusterUpdateStatus.Updating;
  }

  const updates = _.get(cv, 'status.availableUpdates');
  return _.isEmpty(updates) ? ClusterUpdateStatus.UpToDate : ClusterUpdateStatus.UpdatesAvailable;
};

const getIconClass = (status: ClusterUpdateStatus) => {
  return {
    [ClusterUpdateStatus.UpToDate]: 'pficon pficon-ok',
    [ClusterUpdateStatus.UpdatesAvailable]: 'fa fa-arrow-circle-o-up',
    [ClusterUpdateStatus.Updating]: 'fa-spin pficon pficon-in-progress',
    [ClusterUpdateStatus.Failing]: 'pficon pficon-error-circle-o',
    [ClusterUpdateStatus.ErrorRetrieving]: 'pficon pficon-error-circle-o',
  }[status];
};

const FailedConditionAlert = ({message, condition}) => <div className="alert alert-danger">
  <i className="pficon pficon-error-circle-o" aria-hidden="true" /> <strong>{message}</strong> {condition.message}
</div>;

const UpdateInProgressAlert = () => <div className="alert alert-info">
  <i className="pficon pficon-info" aria-hidden={true} />
  Cluster update in progress.
  &nbsp;
  <Link to="/settings/cluster/clusteroperators">
    View detailed progress.
  </Link>
</div>;

const UpdatesAvailableAlert = ({cv}) => <div className="alert alert-info">
  <i className="pficon pficon-info" aria-hidden={true} />
  Cluster update is available.
  <Button bsStyle="link" className="co-m-modal-link" onClick={()=> (launchUpdateModal(cv))}>
    Update Now
  </Button>
</div>;

const UpdateStatus: React.SFC<UpdateStatusProps> = ({cv}) => {
  const status = getClusterUpdateStatus(cv);
  const iconClass = getIconClass(status);
  return <React.Fragment>
    {
      status === ClusterUpdateStatus.UpdatesAvailable
        ? <Button bsStyle="link" className="co-m-modal-link" onClick={() => (launchUpdateModal(cv))}>
          <i className={iconClass} aria-hidden={true}></i>
          &nbsp;
          {status}
        </Button>
        : <span>
          {iconClass && <i className={iconClass} aria-hidden={true}></i>}
          &nbsp;
          {status}
        </span>
    }
  </React.Fragment>;
};

const DesiredVersion: React.SFC<DesiredVersionProps> = ({cv}) => {
  const version = getDesiredClusterVersion(cv);
  return version
    ? <React.Fragment>{version}</React.Fragment>
    : <React.Fragment><i className="pficon pficon-warning-triangle-o" aria-hidden="true" />&nbsp;Unknown</React.Fragment>;
};

const ClusterVersionDetailsTable: React.SFC<ClusterVersionDetailsTableProps> = ({obj: cv, autoscalers}) => {
  const { history = [], conditions = [] } = cv.status;
  const status = getClusterUpdateStatus(cv);
  const retrievedUpdatesFailedCondition = _.find(conditions, { type: 'RetrievedUpdates', status: 'False' });
  const isFailingCondition = _.find(conditions, { type: 'Failing', status: 'True' });

  return <React.Fragment>
    <div className="co-m-pane__body">
      <div className="co-m-pane__body-group">
        { status === ClusterUpdateStatus.Updating && <UpdateInProgressAlert /> }
        { status === ClusterUpdateStatus.UpdatesAvailable && <UpdatesAvailableAlert cv={cv} /> }
        { isFailingCondition && <FailedConditionAlert message="Update is failing." condition={isFailingCondition} /> }
        { retrievedUpdatesFailedCondition && <FailedConditionAlert message="Could not retrieve updates." condition={retrievedUpdatesFailedCondition} /> }
        <div className="co-detail-table">
          <div className="co-detail-table__row row">
            <div className="co-detail-table__section">
              <dl className="co-m-pane__details">
                <dt className="co-detail-table__section-header">Channel</dt>
                <dd><CurrentChannel cv={cv} /></dd>
              </dl>
            </div>
            <div className="co-detail-table__section">
              <dl className="co-m-pane__details">
                <dt className="co-detail-table__section-header">Update Status</dt>
                <dd><UpdateStatus cv={cv} /></dd>
              </dl>
            </div>
            <div className="co-detail-table__section">
              <dl className="co-m-pane__details">
                <dt className="co-detail-table__section-header">Desired Version</dt>
                <dd><DesiredVersion cv={cv} /></dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body-group">
        <dl className="co-m-pane__details">
          <dt>Cluster ID</dt>
          <dd className="co-break-all">{cv.spec.clusterID}</dd>
          <dt>Desired Release Image</dt>
          <dd className="co-break-all">{_.get(cv, 'status.desired.image') || '-'}</dd>
          <dt>Cluster Autoscaler</dt>
          <dd>
            {_.isEmpty(autoscalers)
              ? <Link to={`${resourcePathFromModel(ClusterAutoscalerModel)}/new`}>
                <i className="pficon pficon-add-circle-o" aria-hidden="true" /> Create Autoscaler
              </Link>
              : autoscalers.map(autoscaler => <div key={autoscaler.metadata.uid}><ResourceLink kind={clusterAutoscalerReference} name={autoscaler.metadata.name} /></div>)}
          </dd>
        </dl>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Update History" />
      {_.isEmpty(history)
        ? <EmptyBox label="History" />
        : <div className="co-table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Version</th>
                <th>State</th>
                <th>Started</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {_.map(history, (update, i) => <tr key={i}>
                <td className="co-break-all">{update.version || '-'}</td>
                <td>{update.state || '-'}</td>
                <td><Timestamp timestamp={update.startedTime} /></td>
                <td>{update.completionTime ? <Timestamp timestamp={update.completionTime} /> : '-'}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      }
    </div>
  </React.Fragment>;
};

const ClusterOperatorTabPage: React.SFC = () => <ClusterOperatorPage autoFocus={false} showTitle={false} />;

const pages = [{
  href: '',
  name: 'Overview',
  component: ClusterVersionDetailsTable,
}, {
  href: 'globalconfig',
  name: 'Global Configuration',
  component: GlobalConfigPage,
}, {
  href: 'clusteroperators',
  name: 'Cluster Operators',
  component: ClusterOperatorTabPage,
}];

export const ClusterSettingsPage: React.SFC<ClusterSettingsPageProps> = ({match}) => {
  const title = 'Cluster Settings';
  const resources = [
    {kind: clusterVersionReference, name: 'version', isList: false, prop: 'obj'},
    {kind: clusterAutoscalerReference, isList: true, prop: 'autoscalers', optional: true},
  ];
  const resourceKeys = _.map(resources, 'prop');
  return <React.Fragment>
    <Helmet>
      <title>{title}</title>
    </Helmet>
    <div className="co-m-nav-title">
      <h1 className="co-m-pane__heading">{title}</h1>
    </div>
    <Firehose forceUpdate resources={resources}>
      <HorizontalNav pages={pages} match={match} resourceKeys={resourceKeys} hideDivider />
    </Firehose>
  </React.Fragment>;
};

type UpdateStatusProps = {
  cv: ClusterVersionKind;
};

type CurrentChannelProps = {
  cv: K8sResourceKind;
};

type DesiredVersionProps = {
  cv: ClusterVersionKind;
};

type ClusterVersionDetailsTableProps = {
  obj: ClusterVersionKind;
  autoscalers: K8sResourceKind[];
};

type ClusterSettingsPageProps = {
  match: any;
};
