/* eslint-disable no-undef */

import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

export const enum AlertStates {
  Firing = 'firing',
  Silenced = 'silenced',
  Pending = 'pending',
  NotFiring = 'not-firing',
}

export const enum SilenceStates {
  Active = 'active',
  Pending = 'pending',
  Expired = 'expired',
}

export enum MonitoringRoutes {
  Prometheus = 'prometheus-k8s',
  AlertManager = 'alertmanager-main',
  Grafana = 'grafana',
}

const SET_MONITORING_URL = 'setMonitoringURL';
const DEFAULTS = _.mapValues(MonitoringRoutes, undefined);

export const setMonitoringURL = (name, url) => ({name, url, type: SET_MONITORING_URL});

export const monitoringReducer = (state: ImmutableMap<string, any>, action) => {
  if (!state) {
    return ImmutableMap(DEFAULTS);
  }

  switch (action.type) {
    case SET_MONITORING_URL:
      return state.merge({ [action.name]: action.url });

    default:
      return state;
  }
};

export const monitoringReducerName = 'monitoringURLs';
const stateToProps = (desiredURLs: string[], state) => {
  const urls = desiredURLs.reduce((previous, next) => ({...previous, [next]: state[monitoringReducerName].get(next)}), {});
  return { urls };
};

export const connectToURLs = (...urls) => connect(state => stateToProps(urls, state));

// Determine if an Alert is silenced by a Silence (if all of the Silence's matchers match one of the Alert's labels)
export const isSilenced = (alert, silence) => _.get(silence, 'status.state') === SilenceStates.Active &&
  _.every(silence.matchers, m => {
    const alertValue = _.get(alert.labels, m.name);
    return alertValue !== undefined &&
      (m.isRegex ? (new RegExp(`^${m.value}$`)).test(alertValue) : alertValue === m.value);
  });
