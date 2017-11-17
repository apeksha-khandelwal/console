/* eslint-disable no-undef */

import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { List, ListHeader, ColHead, ResourceRow } from '../factory';
import { PromiseComponent, ResourceIcon } from '../utils';
import { ClusterServiceVersionKind, ClusterServiceVersionLogo, CatalogEntryKind, InstallPlanApproval, isEnabled } from '../cloud-services';
import { InstallPlanModel } from '../../models';

export const SelectNamespaceHeader: React.StatelessComponent<SelectNamespaceHeaderProps> = (props) => <ListHeader>
  <ColHead {...props} className="col-xs-9" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-3">Status</ColHead>
</ListHeader>;

export const SelectNamespaceRow: React.StatelessComponent<SelectNamespaceRowProps> = (props) => {
  const {obj, onSelect, onDeselect, selected} = props;
  const toggle = () => selected ? onDeselect({namespace: obj.metadata.name}) : onSelect({namespace: obj.metadata.name});

  return <ResourceRow obj={obj}>
    <div className={classNames('col-xs-9', 'co-catalog-install__row')} onClick={toggle}>
      <input
        type="checkbox"
        value={obj.metadata.name}
        checked={selected}
        onChange={toggle}
        style={{marginRight: '4px'}}
      />
      <ResourceIcon kind="Namespace" />
      <span>{obj.metadata.name}</span>
    </div>
    <div className="col-xs-3">
      {selected ? <span>Will be enabled</span> : <span className="text-muted">Not enabled</span>}
    </div>
  </ResourceRow>;
};

export class EnableApplicationModal extends PromiseComponent {
  public state: EnableApplicationModalState;

  constructor(public props: EnableApplicationModalProps) {
    super(props);
    this.state.selectedNamespaces = [];
  }

  private submit(event): void {
    event.preventDefault();

    this.handlePromise(Promise.all(this.state.selectedNamespaces
      .map((namespace) => ({
        apiVersion: 'app.coreos.com/v1alpha1',
        kind: 'InstallPlan-v1',
        metadata: {
          generateName: `${this.props.catalogEntry.metadata.name}-`,
          namespace,
        },
        spec: {
          clusterServiceVersionNames: [this.props.catalogEntry.metadata.name],
          approval: InstallPlanApproval.Automatic,
        },
      }))
      .map(installPlan => this.props.k8sCreate(InstallPlanModel, installPlan))))
      .then(() => this.props.close());
  }

  render() {
    const {data, loaded, loadError} = this.props.namespaces;
    const {spec} = this.props.catalogEntry;
    const {clusterServiceVersions} = this.props;
    const {selectedNamespaces} = this.state;

    return <form onSubmit={this.submit.bind(this)} name="form" className="co-catalog-install-modal">
      <ModalTitle className="modal-header co-m-nav-title__detail co-catalog-install-modal__header">
        <ClusterServiceVersionLogo displayName={spec.displayName} provider={spec.provider} icon={spec.icon[0]} />
      </ModalTitle>
      <ModalBody>
        <h4 className="co-catalog-install-modal__h4">Enable Application</h4>
        <div>
          <p className="co-catalog-install-modal__description modal-body__field">Select the deployable namespaces where you want to make the application available.</p>
          <List
            loaded={loaded}
            loadError={loadError}
            data={_.values(data)
              .filter(ns => clusterServiceVersions.find(csv => csv.metadata.namespace === ns.metadata.name) === undefined)
              .filter(ns => isEnabled(ns))}
            Header={SelectNamespaceHeader}
            Row={(props) => <SelectNamespaceRow
              obj={props.obj}
              selected={selectedNamespaces.find(ns => ns === props.obj.metadata.name) !== undefined}
              onSelect={(e) => this.setState({selectedNamespaces: selectedNamespaces.concat([e.namespace])})}
              onDeselect={(e) => this.setState({selectedNamespaces: selectedNamespaces.filter((ns) => ns !== e.namespace)})} />}
          />
        </div>
      </ModalBody>
      <ModalSubmitFooter inProgress={this.state.inProgress} errorMessage={this.state.errorMessage} cancel={this.props.cancel.bind(this)} submitText="Enable" submitDisabled={selectedNamespaces.length === 0}/>
    </form>;
  }
}

export const createEnableApplicationModal = createModalLauncher(EnableApplicationModal);

export type EnableApplicationModalProps = {
  cancel: (e: Event) => void;
  close: () => void;
  watchK8sList: (id: string, query: any, kind: any) => void;
  k8sCreate: (kind, data) => Promise<any>;
  namespaces: {data: {[name: string]: any}, loaded: boolean, loadError: Object | string};
  clusterServiceVersions: ClusterServiceVersionKind[];
  catalogEntry: CatalogEntryKind;
};

export type EnableApplicationModalState = {
  selectedNamespaces: string[];
  inProgress: boolean;
  errorMessage: string;
};

export type SelectNamespaceHeaderProps = {

};

export type SelectNamespaceRowProps = {
  obj: any;
  selected: boolean;
  onDeselect: (e: {namespace: string}) => void;
  onSelect: (e: {namespace: string}) => void;
};

SelectNamespaceHeader.displayName = 'SelectNamespaceHeader';
SelectNamespaceRow.displayName = 'SelectNamespaceRow';
