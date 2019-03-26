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

import angular from 'angular';
import _ from 'lodash';
// @ts-ignore
import rison from 'rison-node';

// @ts-ignore
import { uiModules } from 'ui/modules';

import 'ui/apply_filters';
import 'ui/search_bar';

import { DashboardAppController } from './dashboard_app_controller';

const app = uiModules.get('app/dashboard', [
  'elasticsearch',
  'ngRoute',
  'react',
  'kibana/courier',
  'kibana/config',
]);

app.directive('dashboardApp', ($injector: any) => {
  const AppState = $injector.get('AppState');
  const kbnUrl = $injector.get('kbnUrl');
  const confirmModal = $injector.get('confirmModal') as () => void;
  const config = $injector.get('config');
  const Private = $injector.get('Private');
  const indexPatterns = $injector.get('indexPatterns');

  return {
    restrict: 'E',
    controllerAs: 'dashboardApp',
    controller: (
      $scope: any,
      $route: any,
      $routeParams: any,
      getAppState: any,
      dashboardConfig: any,
      localStorage: any,
      i18n: any
    ) =>
      new DashboardAppController({
        $route,
        $scope,
        $routeParams,
        getAppState,
        dashboardConfig,
        localStorage,
        i18n,
        Private,
        kbnUrl,
        AppStateClass: AppState,
        indexPatterns,
        config,
        confirmModal,
      }),
  };
});
