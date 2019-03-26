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

export interface Trigger {
  id: string;
  title: string;
  description?: string;
  // If not given, this trigger will only show up for these embeddable types.
  // An embeddable itself can also choose to hide certain triggers by returning false for
  // supports(trigger: Trigger).
  embeddableType?: string;
  // Events (trigger -> action) are saved objects. They are meant to be created by content creators,
  // and will then be accessible only to those who access to that saved object.  Some events we want
  // to be hooked up by default, across all spaces. Rather than seeding the database with default
  // saved objects, this is how embeddables can add default actions.
  defaultActions?: string;
}

class TriggerRegistry {
  constructor(private triggers: Trigger[]) {}

  public getTriggers() {
    return this.triggers;
  }

  public getTrigger(id: string) {
    return this.triggers.find(trigger => trigger.id === id);
  }

  public registerTrigger(trigger: Trigger) {
    this.triggers.push(trigger);
  }

  public addDefaultAction({ triggerId, actionId }: { triggerId: string; actionId: string }) {
    const trigger = this.getTrigger(triggerId);
    if (!trigger) {
      throw new Error(`No trigger with is ${triggerId} exists`);
    }
    if (!trigger.defaultActions) {
      trigger.defaultActions = actionId;
    } else {
      const actions = trigger.defaultActions.split(';');
      if (!actions.find(id => id === actionId)) {
        actions.push(actionId);
      }
      trigger.defaultActions = actions.join(';');
    }
  }
}

export const SHOW_VIEW_MODE_TRIGGER = 'VIEW_MODE_MENU';
export const SHOW_EDIT_MODE_TRIGGER = 'EDIT_MODE_MENU';
export const APPLY_FILTER_TRIGGER = 'FITLER_TRIGGER';

export const triggerRegistry = new TriggerRegistry([]);

triggerRegistry.registerTrigger({
  id: SHOW_VIEW_MODE_TRIGGER,
  title: 'View menu',
});

triggerRegistry.registerTrigger({
  id: SHOW_EDIT_MODE_TRIGGER,
  title: 'Edit menu',
});

triggerRegistry.registerTrigger({
  id: APPLY_FILTER_TRIGGER,
  title: 'Filter click',
});
