import * as React from 'react';
import * as classNames from 'classnames';
import { AboutModal as PFAboutModal } from 'patternfly-react';

import { k8sVersion } from '../../module/status';
import { getBrandingDetails } from '../masthead';

export class AboutModal extends React.Component<AboutModalProps, AboutModalState> {
  /* eslint-disable no-undef */
  state = {
    kubernetesVersion: null,
  };

  componentDidMount() {
    this.checkKubernetesVersion();
  }

  private checkKubernetesVersion() {
    k8sVersion()
      .then((data) => this.setState({kubernetesVersion: data.gitVersion}))
      .catch(() => this.setState({kubernetesVersion: 'unknown'}));
  }

  render() {
    const {kubernetesVersion} = this.state;
    const details = getBrandingDetails();

    return <PFAboutModal className={classNames('co-masthead__modal', {'co-masthead__modal--upstream': details.backgroundImg})} logo={details.modalLogoImg} altLogo={details.modalLogoAlt} productTitle={details.productTitle} show={true} onHide={this.props.close}>
      <strong>About</strong>
      <p>{details.productTitle === 'OKD' ? 'OKD' : 'OpenShift'} is Red Hat&apos;s container application platform that
      allows developers to quickly develop, host, and scale applications in a cloud environment.</p>
      {(kubernetesVersion) &&
        <React.Fragment>
          <strong>Version</strong>
          <PFAboutModal.Versions className="co-masthead__modal--version">
            {kubernetesVersion && <PFAboutModal.VersionItem label="Kubernetes Master" versionText={kubernetesVersion} />}
          </PFAboutModal.Versions>
        </React.Fragment>}
    </PFAboutModal>;
  }
}

/* eslint-disable no-undef */
export type AboutModalProps = {
  cancel: (e: Event) => void,
  close: (e: Event) => void,
};

export type AboutModalState = {
  kubernetesVersion: string,
};
