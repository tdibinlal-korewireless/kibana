/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { EuiTab } from '@elastic/eui';
import React, { Component } from 'react';
import { EmbeddableFactory } from 'ui/embeddable';
import { CustomContainerExample } from './custom_container_example';
import { DashboardContainerExample } from './dashboard_container_example';
import { VisualizeEmbeddableExample } from './visualize_embeddable_example';

export interface AppProps {
  getEmbeddableFactory: <I, O>(type: string) => EmbeddableFactory<I, O> | undefined;
}

export class App extends Component<AppProps, { selectedTabId: string }> {
  private tabs: Array<{ id: string; name: string }>;
  constructor(props: AppProps) {
    super(props);
    this.tabs = [
      {
        id: 'dashboardEmbeddable',
        name: 'Dashboard Container',
      },
      {
        id: 'customContainer',
        name: 'Custom Container',
      },
      {
        id: 'visualizeEmbeddable',
        name: 'Visualize Embeddable',
      },
    ];

    this.state = {
      selectedTabId: 'dashboardEmbeddable',
    };
  }

  public onSelectedTabChanged = (id: string) => {
    this.setState({
      selectedTabId: id,
    });
  };

  public renderTabs() {
    return this.tabs.map((tab: { id: string; name: string }, index: number) => (
      <EuiTab
        onClick={() => this.onSelectedTabChanged(tab.id)}
        isSelected={tab.id === this.state.selectedTabId}
        key={index}
      >
        {tab.name}
      </EuiTab>
    ));
  }

  public render() {
    return (
      <div id="dashboardViewport">
        <div>{this.renderTabs()}</div>
        {this.getContentsForTab()}
      </div>
    );
  }

  private getContentsForTab() {
    switch (this.state.selectedTabId) {
      case 'dashboardEmbeddable': {
        return <DashboardContainerExample getEmbeddableFactory={this.props.getEmbeddableFactory} />;
      }
      case 'customContainer': {
        return <CustomContainerExample getEmbeddableFactory={this.props.getEmbeddableFactory} />;
      }
      case 'visualizeEmbeddable': {
        return (
          <VisualizeEmbeddableExample getEmbeddableFactory={this.props.getEmbeddableFactory} />
        );
      }
    }
  }
}
