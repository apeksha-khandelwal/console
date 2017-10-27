/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { Link } from 'react-router-dom';
import { shallow, ShallowWrapper } from 'enzyme';

import { NavTitle, NavTitleProps, BreadCrumbs, BreadCrumbsProps } from '../../../public/components/utils/nav-title';
import { ResourceIcon } from '../../../public/components/utils';

describe(BreadCrumbs.displayName, () => {
  let wrapper: ShallowWrapper<BreadCrumbsProps>;
  let breadcrumbs: BreadCrumbsProps['breadcrumbs'];

  beforeEach(() => {
    breadcrumbs = [
      {name: 'pods', path: '/pods'},
      {name: 'containers', path: '/pods'},
    ];
    wrapper = shallow(<BreadCrumbs breadcrumbs={breadcrumbs} />);
  });

  it('renders link for each given breadcrumb', () => {
    const links: ShallowWrapper<any> = wrapper.find(Link);

    expect(links.length).toEqual(breadcrumbs.length);

    breadcrumbs.forEach((crumb, i) => {
      expect(links.at(i).props().to).toEqual(crumb.path);
      expect(links.at(i).childAt(0).text()).toEqual(crumb.name);
    });
  });

  it('renders separator between each breadcrumb link', () => {
    const separators = wrapper.find('.co-m-nav-title__breadcrumbs__seperator');

    expect(separators.length).toEqual(breadcrumbs.length - 1);

    separators.forEach((separator) => {
      expect(separator.text()).toEqual('/');
    });
  });
});

describe(NavTitle.displayName, () => {
  let wrapper: ShallowWrapper<NavTitleProps>;

  beforeEach(() => {
    wrapper = shallow(<NavTitle obj={null} />);
  });

  it('renders resource icon if given `kind`', () => {
    const kind = 'Pod';
    wrapper.setProps({kind});
    const icon = wrapper.find(ResourceIcon);

    expect(icon.exists()).toBe(true);
    expect(icon.props().kind).toEqual(kind);
  });

  it('renders custom title component if given', () => {
    const title = <span>My Custom Title</span>;
    wrapper.setProps({title});

    expect(wrapper.find('.co-m-page-title').contains(title)).toBe(true);
  });

  it('renders breadcrumbs if given `breadcrumbs`', () => {
    const breadcrumbs = [];
    wrapper.setProps({breadcrumbs});

    expect(wrapper.find(BreadCrumbs).exists()).toBe(true);
    expect(wrapper.find(BreadCrumbs).props().breadcrumbs).toEqual(breadcrumbs);
  });
});
