import {coFetchJSON} from '../../co-fetch';
import {k8sBasePath} from './k8s';
import {selectorToString} from './selector';
import {wsFactory} from '../ws-factory';

const apiVersion = window.SERVER_FLAGS.k8sAPIVersion;

const getK8sAPIPath = kind => {
  let p = k8sBasePath;

  if (kind.isExtension) {
    p += '/apis/extensions/';
  } else if (kind.basePath) {
    p += kind.basePath;
  } else {
    p += '/api/';
  }

  p += kind.apiVersion || apiVersion;
  return p;
};

export const resourceURL = (kind, options) => {
  let q = '';
  let u = getK8sAPIPath(kind);

  if (options.ns) {
    u += `/namespaces/${options.ns}`;
  }
  u += `/${kind.path}`;
  if (options.name) {
    u += `/${options.name}`;
  }
  if (options.path) {
    u += `/${options.path}`;
  }
  if (!_.isEmpty(options.queryParams)) {
    q = _.map(options.queryParams, function(v, k) {
      return `${k}=${v}`;
    });
    u += `?${q.join('&')}`;
  }

  return u;
};

export const watchURL = (kind, options) => {
  const opts = options || {};

  opts.queryParams = opts.queryParams || {};
  opts.queryParams.watch = true;
  return resourceURL(kind, opts);
};

export const k8sGet = (kind, name, ns, opts) => coFetchJSON(resourceURL(kind, Object.assign({ns, name}, opts)));

export const k8sCreate = (kind, data) => {
  // Lowercase the resource name
  // https://github.com/kubernetes/kubernetes/blob/HEAD/docs/user-guide/identifiers.md#names
  if (!data.metadata.generateName) {
    data.metadata.name = data.metadata.name.toLowerCase();
  }

  return coFetchJSON.post(resourceURL(kind, {ns: data.metadata.namespace}), data);
};

export const k8sUpdate = (kind, data, ns, name) => coFetchJSON.put(
  resourceURL(kind, {ns: ns || data.metadata.namespace, name: name || data.metadata.name}),
  data
);

export const k8sPatch = (kind, resource, data) => coFetchJSON.patch(
  resourceURL(kind, {ns: resource.metadata.namespace, name: resource.metadata.name}),
  data
);

export const k8sKill = (kind, resource, opts = {}, json = null) => coFetchJSON.delete(
  resourceURL(kind, Object.assign({ns: resource.metadata.namespace, name: resource.metadata.name}, opts)), opts, json
);

export const k8sList = (kind, params={}) => {
  const query = _(params)
    .omit('ns')
    .map((v, k) => {
      if (k === 'labelSelector') {
        v = selectorToString(v);
      }
      return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
    })
    .value()
    .join('&');

  const k = kind.kind === 'Namespace' ? {
    // hit our custom /namespaces path which better handles users with limited permissions
    basePath: '../../',
    apiVersion: 'tectonic',
    path: 'namespaces',
  } : kind;

  const listURL = resourceURL(k, {ns: params.ns});
  return coFetchJSON(`${listURL}?${query}`).then(result => result.items);
};

export const k8sWatch = (kind, query={}) => {
  const queryParams = {watch: true};
  const opts = {queryParams};

  const labelSelector = query.labelSelector || kind.labelSelector;
  if (labelSelector) {
    const encodedSelector = encodeURIComponent(selectorToString(labelSelector));
    if (encodedSelector) {
      queryParams.labelSelector = encodedSelector;
    }
  }

  if (query.fieldSelector) {
    queryParams.fieldSelector = encodeURIComponent(query.fieldSelector);
  }

  if (query.ns) {
    opts.ns = query.ns;
  }

  const path = resourceURL(kind, opts);
  return wsFactory(path, {
    host: 'auto',
    reconnect: true,
    path: path,
    jsonParse: true,
    bufferEnabled: true,
    bufferFlushInterval: 500,
    bufferMax: 1000,
  });
};
