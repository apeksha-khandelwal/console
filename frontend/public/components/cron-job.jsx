import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, navFactory, ResourceCog, Heading, ResourceLink, ResourceSummary, Timestamp } from './utils';
import { registerTemplate } from '../yaml-templates';

registerTemplate('batch/v1beta1.CronJob', `apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: example
spec:
  schedule: "*/1 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: hello
            image: busybox
            args:
            - /bin/sh
            - -c
            - date; echo Hello from the Kubernetes cluster
          restartPolicy: OnFailure
`);


const menuActions = [Cog.factory.Edit, Cog.factory.Delete];

const Header = props => <ListHeader>
  <ColHead {...props} className="col-xs-3" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="spec.schedule">Schedule</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="spec.schedule">Concurrency Policy</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="spec.schedule">Starting Deadline Seconds</ColHead>
</ListHeader>;

const kind = 'CronJob';
const Row = ({obj: cronjob}) => <div className="row co-resource-list__item">
  <div className="col-xs-3">
    <ResourceCog actions={menuActions} kind={kind} resource={cronjob} />
    <ResourceLink kind={kind} name={cronjob.metadata.name} title={cronjob.metadata.name} />
  </div>
  <div className="col-xs-3">
    {cronjob.spec.schedule}
  </div>
  <div className="col-xs-3">
    {_.get(cronjob.spec, 'concurrencyPolicy', '-')}
  </div>
  <div className="col-xs-3">
    {_.get(cronjob.spec, 'startingDeadlineSeconds', '-')}
  </div>
</div>;

const Details = ({obj: cronjob}) => {
  const job = cronjob.spec.jobTemplate;
  return <div>
    <div className="row no-gutter">
      <div className="col-md-6">
        <Heading text="CronJob Overview" />
        <div className="co-m-pane__body-group">
          <div className="co-m-pane__body-section--bordered">
            <ResourceSummary resource={cronjob} showNodeSelector={false} showPodSelector={false} showAnnotations={false}>
              <dt>Schedule</dt>
              <dd>{cronjob.spec.schedule}</dd>
              <dt>Concurrency Policy</dt>
              <dd>{_.get(cronjob.spec, 'concurrencyPolicy', '-')}</dd>
              <dt>Starting Deadline Seconds</dt>
              <dd>{_.get(cronjob.spec, 'startingDeadlineSeconds', '-')}</dd>
            </ResourceSummary>
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <Heading text="Job Overview" />
        <div className="co-m-pane__body-group">
          <div className="co-m-pane__body-section--bordered">
            <ResourceSummary resource={cronjob} showNodeSelector={false}>
              <dt>Desired Completions</dt>
              <dd>{job.spec.completions || '-'}</dd>
              <dt>Parallelism</dt>
              <dd>{job.spec.parallelism || '-'}</dd>
              <dt>Deadline</dt>
              <dd>{job.spec.activeDeadlineSeconds ? `${job.spec.activeDeadlineSeconds} seconds` : '-'}</dd>
              <dt>Status</dt>
              <dd>{_.get(job, 'status.conditions[0].type', 'In Progress')}</dd>
              <dt>Start Time</dt>
              <dd><Timestamp timestamp={_.get(job, 'status.startTime')} /></dd>
              <dt>Completion Time</dt>
              <dd><Timestamp timestamp={_.get(job, 'status.completionTime')} /></dd>
            </ResourceSummary>
          </div>
        </div>
      </div>
    </div>
  </div>;
};

export const CronJobsList = props => <List {...props} Header={Header} Row={Row} />;
export const CronJobsPage = props => <ListPage {...props} ListComponent={CronJobsList} kind={kind} canCreate={true} />;

export const CronJobsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;
