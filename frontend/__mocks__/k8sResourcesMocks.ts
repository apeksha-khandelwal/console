/* eslint-disable no-unused-vars */
import { ClusterServiceVersionKind, ClusterServiceVersionResourceKind, ALMStatusDescriptors, CatalogEntryKind, InstallPlanKind, ClusterServiceVersionPhase, CSVConditionReason } from '../public/components/cloud-services';
import { CustomResourceDefinitionKind, K8sResourceKind } from '../public/module/k8s';
/* eslint-enable no-unused-vars */

export const testNamespace: K8sResourceKind = {
  apiVersion: 'v1',
  kind: 'Namespace',
  metadata: {
    name: 'default',
    annotations: {'alm-manager': 'tectonic-system.alm-operator'},
  }
};

export const testClusterServiceVersion: ClusterServiceVersionKind = {
  apiVersion: 'app.coreos.com/v1alpha1',
  kind: 'ClusterServiceVersion-v1',
  metadata: {
    name: 'testapp',
    uid: 'c02c0a8f-88e0-11e7-851b-080027b424ef',
    creationTimestamp: '2017-09-20T18:19:49Z',
    deletionTimestamp: null,
    namespace: 'default',
  },
  spec: {
    displayName: 'Test App',
    description: 'This app does cool stuff',
    provider: {
      name: 'MyCompany, Inc',
    },
    links: [
      {name: 'Documentation', url: 'https://docs.testapp.com'},
    ],
    maintainers: [
      {name: 'John Doe', email: 'johndoe@example.com'},
    ],
    icon: [
      {base64data: '', mediatype: 'image/png',}
    ],
    labels: {
      'alm-owner-testapp': 'testapp.clusterserviceversion-v1s.app.coreos.com.v1alpha1',
      'alm-catalog': 'open-cloud-services.coreos.com',
    },
    selector: {
      matchLabels: {
        'alm-owner-testapp': 'testapp.clusterserviceversion-v1s.app.coreos.com.v1alpha1'
      }
    },
    customresourcedefinitions: {
      owned: [{
        name: 'testresource.testapp.coreos.com',
        kind: 'TestResource',
        version: 'v1',
        displayName: 'Test Resource',
        resources: [{
          kind: 'Pod',
          version: 'v1',
        }],
        specDescriptors: [{
          path: 'size',
          displayName: 'Size',
          description: 'The desired number of Pods for the cluster',
          'x-descriptors': ['urn:alm:descriptor:com.tectonic.ui:podCount'],
        }],
        statusDescriptors: [{
          path: 'importantMetrics',
          displayName: 'Important Metrics',
          description: 'Important prometheus metrics ',
          'x-descriptors': [ALMStatusDescriptors.importantMetrics],
          value: {
            queries: [{
              query: 'foobarbaz',
              name: 'something',
              type: 'gauge',
            }],
          }
        },
        {
          path: 'some-unfilled-path',
          displayName: 'Some Unfilled Path',
          description: 'This status is unfilled in the tests',
          'x-descriptors': [ALMStatusDescriptors.text],
        },
        {
          path: 'some-filled-path',
          displayName: 'Some Status',
          description: 'This status is filled',
          'x-descriptors': [ALMStatusDescriptors.text],
        }]
      }],
    }
  },
  status: {
    phase: ClusterServiceVersionPhase.CSVPhaseSucceeded,
    reason: CSVConditionReason.CSVReasonInstallSuccessful,
  },
};

export const localClusterServiceVersion: ClusterServiceVersionKind = {
  apiVersion: 'app.coreos.com/v1alpha1',
  kind: 'ClusterServiceVersion-v1',
  metadata: {
    name: 'local-testapp',
    uid: 'c02c0a8f-88e0-12e7-851b-080027b424ef',
    creationTimestamp: '2017-08-20T18:19:49Z',
    namespace: 'default',
  },
  spec: {
    displayName: 'Local Test App',
    description: 'This app does cool stuff - locally',
    labels: {
      'alm-owner-local-testapp': 'local-testapp.clusterserviceversion-v1s.app.coreos.com.v1alpha1',
    },
    selector: {
      matchLabels: {
        'alm-owner-local-testapp': 'local-testapp.clusterserviceversion-v1s.app.coreos.com.v1alpha1'
      }
    },
    customresourcedefinitions: {
      owned: [{
        name: 'testresource.testapp.coreos.com',
        kind: 'TestResource',
        version: 'v1',
        displayName: 'Test Resource',
        statusDescriptors: [],
      }],
    },
  },
  status: {
    phase: ClusterServiceVersionPhase.CSVPhaseSucceeded,
    reason: CSVConditionReason.CSVReasonInstallSuccessful,
  }
};

export const testClusterServiceVersionResource: CustomResourceDefinitionKind = {
  apiVersion: 'apiextensions.k8s.io/v1beta1',
  kind: 'CustomResourceDefinition',
  metadata: {
    name: 'testresource.testapp.coreos.com',
    labels: {
      'owner-testapp': 'testapp.clusterserviceversion-v1s.coreos.com',
    },
    annotations: {
      displayName: 'Dashboard',
      description: 'Test Dashboard',
    }
  },
  spec: {
    group: 'testapp.coreos.com',
    version: 'v1alpha1',
    names: {
      kind: 'TestResource',
      plural: 'testresources',
      singular: 'testresource',
      listKind: 'TestResourceList',
    },
  }
};

export const testResourceInstance: ClusterServiceVersionResourceKind = {
  apiVersion: 'testapp.coreos.com/v1alpha1',
  kind: 'TestResource',
  metadata: {
    name: 'my-test-resource',
    namespace: 'default',
    uid: 'c02c0a8f-88e0-12e7-851b-081027b424ef',
    creationTimestamp: '2017-06-20T18:19:49Z',
  },
  spec: {
    selector: {
      matchLabels: {
        'fizz': 'buzz',
      },
    },
  },
  status: {
    'some-filled-path': 'this is filled!',
  },
};

export const testOwnedResourceInstance: ClusterServiceVersionResourceKind = {
  apiVersion: 'ownedapp.coreos.com/v1alpha1',
  kind: 'TestOwnedResource',
  metadata: {
    name: 'owned-test-resource',
    uid: '62fa5eac-3df4-448d-a576-916dd5b432f2',
    creationTimestamp: '2005-02-20T18:13:42Z',
    ownerReferences: [{
      name: testResourceInstance.metadata.name,
      kind: 'TestResource',
      apiVersion: testResourceInstance.apiVersion,
      uid: testResourceInstance.metadata.uid,
    }]
  },
  spec: {},
  status: {
    'some-filled-path': 'this is filled!',
  },
};

export const testCatalogApp: CatalogEntryKind = {
  apiVersion: 'app.coreos.com/v1alpha1',
  kind: 'UICatalogEntry-v1',
  metadata: {
    name: 'testapp',
    uid: 'c02c0a8f-88e0-11e7-851b-080027b424ef',
    creationTimestamp: '2017-09-20T18:19:49Z',
    namespace: 'default',
  },
  spec: {
    displayName: 'Test App',
    description: 'This app does cool stuff',
    provider: 'MyCompany, Inc',
    links: [
      {name: 'Documentation', url: 'https://docs.testapp.com'},
    ],
    maintainers: [
      {name: 'John Doe', email: 'johndoe@example.com'},
    ],
    icon: [
      {base64data: '', mediatype: 'image/png',}
    ],
    labels: {
      'alm-owner-testapp': 'testapp.clusterserviceversion-v1s.app.coreos.com.v1alpha1',
      'alm-catalog': 'open-cloud-services.coreos.com',
    },
  },
};

export const testInstallPlan: InstallPlanKind = {
  apiVersion: 'app.coreos.com/v1alpha1',
  kind: 'InstallPlan-v1',
  metadata: {
    namespace: 'default',
    name: 'etcd',
  },
  spec: {
    clusterServiceVersionNames: ['etcd'],
    approval: 'Automatic',
  },
  status: {
    status: 'Complete',
    plan: [],
  },
};

export const testOperatorDeployment: K8sResourceKind = {
  apiVersion: 'apps/v1beta2',
  kind: 'Deployment',
  metadata: {
    namespace: testClusterServiceVersion.metadata.namespace,
    name: 'test-operator',
    ownerReferences: [{
      name: testClusterServiceVersion.metadata.name,
      uid: testClusterServiceVersion.metadata.uid,
      kind: testClusterServiceVersion.kind,
      apiVersion: testClusterServiceVersion.apiVersion
    }],
    spec: {

    }
  }
};
