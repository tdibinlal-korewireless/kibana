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

import { BasePathSetup } from './base_path';
import { ChromeSetup } from './chrome';
import { FatalErrorsSetup } from './fatal_errors';
import { HttpSetup } from './http';
import { I18nSetup } from './i18n';
import { InjectedMetadataSetup } from './injected_metadata';
import { NotificationsSetup } from './notifications';
import { UiSettingsSetup } from './ui_settings';

export { CoreSystem } from './core_system';

export interface CoreSetup {
  i18n: I18nSetup;
  injectedMetadata: InjectedMetadataSetup;
  fatalErrors: FatalErrorsSetup;
  notifications: NotificationsSetup;
  http: HttpSetup;
  basePath: BasePathSetup;
  uiSettings: UiSettingsSetup;
  chrome: ChromeSetup;
}
