/* eslint-disable no-undef */

import * as React from 'react';
import * as classNames from 'classnames';

import { connectToModel } from '../../kinds';
import { K8sResourceKindReference, K8sKind } from '../../module/k8s';

export const ResourceIcon = connectToModel((props: ResourceIconProps) => {
  const kindStr = props.kindObj.kind || '';
  const klass = classNames(`co-m-resource-icon co-m-resource-${kindStr.toLowerCase()}`, props.className);
  const iconLabel = props.kindObj.abbr || kindStr.toUpperCase().slice(0, 2);

  return <span className={klass}>{iconLabel}</span>;
});

export type ResourceIconProps = {
  className: string;
  kindObj: K8sKind;
};

export const ResourceName: React.StatelessComponent<ResourceNameProps> = (props) => <span><ResourceIcon kind={props.kind} /> {props.name}</span>;

export type ResourceNameProps = {
  kind: K8sResourceKindReference;
  name: string;
};

ResourceIcon.displayName = 'ResourceIcon';
ResourceName.displayName = 'ResourceName';
