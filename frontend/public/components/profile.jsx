import React from 'react';
import Helmet from 'react-helmet';

import { authSvc } from '../module/auth';
import { kubectlConfigModal, tokenInfoModal } from './modals';
import { NavTitle } from './utils';
import { SafetyFirst } from './safety-first';
import { ClientTokensContainer } from './client-tokens';

export class ProfilePage extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      isKubeCtlDownloaded: false
    };
    this._onKubeCtlDownloaded = this._onKubeCtlDownloaded.bind(this);
  }

  _onKubeCtlDownloaded() {
    this.setState({ isKubeCtlDownloaded: true });
  }

  render() {
    return <div className="co-p-profile">
      <Helmet title="Profile" />
      <NavTitle detail={true} title="Profile" />
      <div className="co-m-pane">
        <div className="co-m-pane__body">
          <div className="co-m-pane__body-section--bordered">
            <dl>
              <dt>Name</dt>
              <dd>{authSvc.name() || '-'}</dd>
              <dt>Email Address</dt>
              <dd>{authSvc.email() || '-'}</dd>
              <dt>kubectl</dt>
              <dd><button className="btn btn-default" type="button" onClick={() => kubectlConfigModal({ callback: this._onKubeCtlDownloaded })}>Download Configuration</button></dd>
              <dt>Auth Token</dt>
              <dd><button className="btn btn-default" type="button" onClick={() => tokenInfoModal()}>Show Token Information</button></dd>
            </dl>
          </div>
        </div>
        <ClientTokensContainer isKubeCtlDownloaded={this.state.kubectl} />
      </div>
    </div>;
  }
}
