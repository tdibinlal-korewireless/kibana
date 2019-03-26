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

import { Container } from 'ui/embeddable/containers';
import { Embeddable } from '../embeddables';

import {
  ActionSavedObject,
  ActionSavedObjectAttributes,
} from 'ui/embeddable/actions/action_saved_object';
import { PanelActionAPI } from '../context_menu_actions';
export interface ExecuteOptions {
  embeddable?: Embeddable;
  container?: Container;
  triggerContext?: {};
}

export abstract class Action {
  public id: string;

  // User facing display name of the action. Can also be derived dynamically via getTitle.
  public title: string;

  // If specified, this action is compatible with only the given instance id.
  public embeddableType: string = '';

  // If specified, this action is compatible with only the given embeddable type.
  public embeddableId: string = '';

  // If type is empty this is a default action. No type string, or factory is required
  // Instead an instance must have been added to the action registry
  // during plugin initialization phase, ala somethign like:
  // actionRegistry.addAction(new MySingletonGlobalAction());
  public readonly type?: string;

  public description: string = '';

  public embeddableTemplateMapping: { [key: string]: string } = {};

  constructor({
    actionSavedObject,
    type,
  }: {
    actionSavedObject?: ActionSavedObject;
    type?: string;
  } = {}) {
    this.id = actionSavedObject ? actionSavedObject.id : '';
    this.title = actionSavedObject ? actionSavedObject.attributes.title : 'New action';
    this.type =
      actionSavedObject && actionSavedObject.attributes.type
        ? actionSavedObject.attributes.type
        : type;
    if (actionSavedObject) {
      this.embeddableId = actionSavedObject.attributes.embeddableId;
      this.embeddableType = actionSavedObject.attributes.embeddableType;
      if (
        actionSavedObject.attributes.embeddableTemplateMapping &&
        actionSavedObject.attributes.embeddableTemplateMapping !== ''
      ) {
        this.embeddableTemplateMapping = JSON.parse(
          actionSavedObject.attributes.embeddableTemplateMapping
        );
      }
    }
  }

  public getTitle({ embeddable, container }: PanelActionAPI) {
    return this.title;
  }

  public isCompatible({
    embeddable,
    container,
  }: {
    embeddable?: Embeddable;
    container?: Container;
  }): Promise<boolean> {
    if (this.embeddableId !== '') {
      return Promise.resolve(!!embeddable && embeddable.id === this.embeddableId);
    } else if (this.embeddableType !== '') {
      return Promise.resolve(!!embeddable && embeddable.type === this.embeddableType);
    } else {
      return Promise.resolve(true);
    }
  }

  public abstract execute(executeOptions: {
    embeddable?: Embeddable;
    container?: Container;
    triggerContext?: {};
  }): void;

  public allowTemplateMapping() {
    return true;
  }

  public allowEditing() {
    return true;
  }

  public getSavedObjectAttributes(): ActionSavedObjectAttributes {
    return {
      title: this.title,
      embeddableType: this.embeddableType,
      type: this.type || '',
      embeddableId: this.embeddableId,
      description: this.description,
      configuration: this.getConfiguration(),
      embeddableTemplateMapping: this.mappingToString(),
    };
  }

  public updateConfiguration(config: string) {
    return;
  }

  public mappingToString() {
    return JSON.stringify(this.embeddableTemplateMapping);
  }

  public mappingFromString(mapping: string) {
    this.embeddableTemplateMapping = JSON.parse(mapping);
  }

  public getConfiguration() {
    return '';
  }

  protected flatten(shape: { [key: string]: any }, prefix = '') {
    let output: { [key: string]: string } = {};
    if (!shape) {
      return {};
    }
    Object.keys(shape).map(key => {
      const value = shape[key];
      if (Array.isArray(value) || typeof value === 'object') {
        output = {
          ...output,
          ...this.flatten(shape[key], prefix + key + '.'),
        };
      } else {
        output[prefix + key] = value;
      }
    });
    return output;
  }

  protected injectTemplateParameters<E extends Embeddable>(
    template: string,
    embeddable?: E,
    triggerContext?: { [key: string]: any }
  ) {
    let output = template;
    const mapping = this.embeddableTemplateMapping;

    const embeddableOutput = embeddable ? { ...embeddable.getOutput() } : {};

    // This will cause a circular reference error I believe, just commenting out as not neccessary
    // for POC. We should only export raw data in output.
    delete embeddableOutput.indexPatterns;

    const flattenedEmbeddableOutput = this.flatten(embeddableOutput, 'element.');
    const flattenedTriggerContext = this.flatten(triggerContext || {}, 'triggerContext.');
    const flattenedOutput: { [key: string]: any } = {
      ...flattenedEmbeddableOutput,
      ...flattenedTriggerContext,
    };
    Object.keys(mapping).forEach(name => {
      const path = mapping[name];
      const replaceValue = `\$\{${name}\}`;
      output = output.replace(replaceValue, flattenedOutput[path]);
    });
    return output;
  }
}
