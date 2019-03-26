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

import { IPrivate } from 'ui/private';
import 'uiExports/contextMenuActions';
import { DashboardContainerFactory } from './dashboard_container_factory';

import {
  ContextMenuActionsRegistryProvider,
  EmbeddableFactoriesRegistryProvider,
} from 'ui/embeddable';
import { panelActionsStore } from './panel_actions_store';

export function dashboardContainerFactoryProvider(Private: IPrivate) {
  const DashboardContainerFactoryProvider = () => {
    const panelActionsRegistry = Private(ContextMenuActionsRegistryProvider);
    panelActionsStore.initializeFromRegistry(panelActionsRegistry);

    // Can't do this because you'll get a circular reference error.
    // const embeddableFactories = Private(EmbeddableFactoriesRegistryProvider);
    // const getEmbeddableFactory = (panelType: string) => embeddableFactories.byName[panelType];

    return new DashboardContainerFactory();
  };
  return Private(DashboardContainerFactoryProvider);
}

EmbeddableFactoriesRegistryProvider.register(dashboardContainerFactoryProvider);
