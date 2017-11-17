import * as React from 'react';
import * as classNames from'classnames';
import { Tooltip } from 'react-lightweight-tooltip';

import { annotationsModal, configureReplicaCountModal, labelsModal, nodeSelectorModal, podSelectorModal, deleteModal } from '../modals';
import { DropdownMixin } from './dropdown';
import { history, kindObj, resourceObjPath } from './index';

export class Cog extends DropdownMixin {
  render () {
    const onClick_ = (option, event) => {
      event.preventDefault();

      if (option.callback) {
        option.callback();
      }

      if (option.href) {
        history.push(option.href);
      }

      this.hide();
    };

    let {options, size, anchor, isDisabled, id} = this.props;

    const shownOptions = _.reject(options, o => _.get(o, 'hidden', false));
    const lis = _.map(shownOptions, (o, i) => <li key={i}><a onClick={onClick_.bind({}, o)}>{o.label}</a></li>);
    const style = {display: this.state.active ? 'block' : 'none'};

    return (
      <div className="co-m-cog-wrapper" id={id}>
        { isDisabled ?
          <Tooltip content="disabled">
            <div ref={this.setNode} className={classNames('co-m-cog', `co-m-cog--anchor-${anchor || 'left'}`, {'co-m-cog--disabled' : isDisabled})} >
              <span className={classNames('co-m-cog', 'co-m-cog__icon', `co-m-cog__icon--size-${size || 'small'}`, 'fa', 'fa-cog', {'co-m-cog__icon--disabled' : isDisabled})}></span>
            </div>
          </Tooltip>
          : <div ref={this.setNode} onClick={this.toggle} className={classNames('co-m-cog', `co-m-cog--anchor-${anchor || 'left'}`, {'co-m-cog--disabled' : isDisabled})} >
            <span className={classNames('co-m-cog', 'co-m-cog__icon', `co-m-cog__icon--size-${size || 'small'}`, 'fa', 'fa-cog', {'co-m-cog__icon--disabled' : isDisabled})}></span>
            <ul className="co-m-cog__dropdown dropdown--dark dropdown-menu" style={style}>
              {lis}
            </ul>
          </div>
        }
      </div>
    );
  }
}

Cog.factory = {
  Delete: (kind, obj) => ({
    label: `Delete ${kind.label}...`,
    callback: () => deleteModal({
      kind: kind,
      resource: obj,
    }),
  }),
  Edit: (kind, obj) => ({
    label: `Edit ${kind.label}...`,
    href: `${resourceObjPath(obj, kind.kind)}/yaml`,
  }),
  ModifyLabels: (kind, obj) => ({
    label: 'Modify Labels...',
    callback: () => labelsModal({
      kind: kind,
      resource: obj,
    }),
  }),
  ModifyPodSelector: (kind, obj) => ({
    label: 'Modify Pod Selector...',
    callback: () => podSelectorModal({
      kind: kind,
      resource:  obj,
    }),
  }),
  ModifyNodeSelector: (kind, obj) => ({
    label: 'Modify Node Selector...',
    callback: () => nodeSelectorModal({
      kind: kind,
      resource: obj,
    }),
  }),
  ModifyAnnotations: (kind, obj) => ({
    label: 'Modify Annotations...',
    callback: () => annotationsModal({
      kind: kind,
      resource: obj,
    }),
  }),
  ModifyCount: (kind, obj) => ({
    label: 'Modify Count...',
    callback: () => configureReplicaCountModal({
      resourceKind: kind,
      resource: obj,
    }),
  }),
};

// The common menu actions that most resource share
Cog.factory.common = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

/** @type {React.StatelessComponent<{actions: any[], kind: string, resource: any, isDisabled?: boolean}>} */
export const ResourceCog = ({actions, kind, resource, isDisabled}) => {
  //Don't show the resource cog if deletionTimestamp is set which means the resources is in 'deletion in progress' state
  return _.get(resource.metadata, 'deletionTimestamp') ? null : <Cog
    options={actions.map(a => a(kindObj(kind), resource))}
    key={resource.metadata.uid}
    isDisabled={isDisabled}
    id={`cog-for-${resource.metadata.uid}`}
  />;
};

ResourceCog.displayName = 'ResourceCog';
