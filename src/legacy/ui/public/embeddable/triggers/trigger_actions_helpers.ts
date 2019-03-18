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

import chrome from 'ui/chrome';
import { Action, getAction } from '../actions';
import {
  TriggerActionsSavedObject,
  TriggerActionsSavedObjectAttributes,
} from './trigger_actions_saved_object';
import { triggerRegistry } from './trigger_registry';

function isAction(action: Action | { message: string; statusCode?: number }): action is Action {
  return (action as Action).title !== undefined;
}

export async function addTriggerActionMapping({
  triggerId,
  actionId,
}: {
  triggerId: string;
  actionId: string;
}) {
  const savedObjectsClient = await chrome.getSavedObjectsClient();
  const response = await savedObjectsClient.get<TriggerActionsSavedObjectAttributes>(
    'ui_trigger',
    triggerId
  );

  if (response.error && response.error.statusCode === 404) {
    // Create a mapping with this trigger id, it doesn't exist.
    await savedObjectsClient.create('ui_trigger', { actions: actionId }, { id: triggerId });
  } else if (!response.error) {
    const actionIds = await getActionIdsForTrigger(triggerId);
    actionIds.push(actionId);
    // Add the action to the existing mapping.
    await savedObjectsClient.update('ui_trigger', triggerId, { actions: actionIds.join(';') });
  } else {
    throw new Error(`Unexpected result searching for Event with id ${triggerId}`);
  }
}

export async function removeTriggerActionMapping({
  triggerId,
  actionId,
}: {
  triggerId: string;
  actionId: string;
}) {
  const savedObjectsClient = await chrome.getSavedObjectsClient();
  const response = await savedObjectsClient.get<TriggerActionsSavedObjectAttributes>(
    'ui_trigger',
    triggerId
  );

  if (response.error && response.error.statusCode === 404) {
    // A mapping with this trigger id doesn't exist.
    return;
  } else if (!response.error) {
    const actionIds = await getActionIdsForTrigger(triggerId);
    const newActionIds = actionIds.filter(id => id === actionId);
    // Add the action to the existing mapping.
    await savedObjectsClient.update('ui_trigger', triggerId, { actions: newActionIds.join(';') });
  } else {
    throw new Error(`Unexpected result searching for Event with id ${triggerId}`);
  }
}

async function fromSavedObject(triggerActionsSavedObject: TriggerActionsSavedObject) {
  const event = new TriggerActions(triggerActionsSavedObject);

  const actionIds: string[] = [];

  if (
    triggerActionsSavedObject.attributes.actions &&
    triggerActionsSavedObject.attributes.actions !== ''
  ) {
    actionIds.push(...triggerActionsSavedObject.attributes.actions.split(';'));
  }

  const triggerDefinition = triggerRegistry.getTrigger(event.trigger.id);

  if (triggerDefinition && triggerDefinition.defaultActions) {
    triggerDefinition.defaultActions.split(';').forEach(defaultAction => {
      if (!actionIds.find(id => id === defaultAction)) {
        actionIds.push(defaultAction);
      }
    });
  }

  const promises = actionIds.map(async actionId => {
    if (actionId) {
      // Dangling action links are possible.
      const action = await getAction(actionId);
      if (action && isAction(action)) {
        event.addAction(action);
      }
    }
  });
  await Promise.all(promises);

  return event;
}

function toSavedObjectAttributes(triggerActions: TriggerActions) {
  const actionIds = triggerActions.getActions().map(action => action.id);
  return {
    actions: actionIds.join(';'),
  };
}

async function getDefaultActionsForTrigger(triggerId: string) {
  const actions: Action[] = [];
  const trigger = triggerRegistry.getTrigger(triggerId);
  if (trigger && trigger.defaultActions && trigger.defaultActions !== '') {
    const promises = trigger.defaultActions.split(';').map(async actionId => {
      if (actionId) {
        // Dangling action links are possible.
        const action = await getAction(actionId);
        if (action && isAction(action)) {
          actions.push(action);
        }
      }
    });
    await Promise.all(promises);
  }
  return actions;
}

export async function getAllTriggerActions() {
  const allTriggerActions: TriggerActions[] = [];
  const allTriggers = triggerRegistry.getTriggers();

  const promises = allTriggers.map(trigger => {
    allTriggerActions.push(TriggerActions.getTriggerActions(trigger.id));
  });

  // Convert the ids to real action objects

  allTriggerActions.forEach(triggerActions => {});
  const response = await chrome.getSavedObjectsClient().find<TriggerActionsSavedObjectAttributes>({
    type: 'ui_trigger',
    fields: ['title', 'description', 'actions', 'embeddableId', 'embeddableType'],
    perPage: 10000,
  });

  const allTriggerActions: TriggerActions[] = [];
  const loadTriggerActions = response.savedObjects.map(async actionSavedObject => {
    const triggerActions = await fromSavedObject(actionSavedObject);
    if (triggerActions) {
      allTriggerActions.push(triggerActions);
    }
  });

  await Promise.all(loadTriggerActions);

  const loadDefaultActions = triggerRegistry.getTriggers().map(async trigger => {
    // Trigger actions may exist as a saved object, or they may only ex
    const triggerActionMapping =
      allTriggerActions.find(triggerActions => triggerActions.trigger.id === trigger.id) ||
      new TriggerActions(trigger);

    const defaultActionsForTrigger = await getDefaultActionsForTrigger(trigger.id);
    defaultTriggerActions.forEach(defaultAction =>
      triggerActionMappingFound.addAction(defaultAction)
    );

    // Make sure that if the trigger mapping already exists as a saved object, it includes
    // all default actions registered by plugins.
    if (triggerActionMappingFound) {
      const defaultTriggerActions = await getDefaultActionsForTrigger(trigger.id);
      defaultTriggerActions.forEach(defaultAction =>
        triggerActionMappingFound.addAction(defaultAction)
      );
    } else {
      // If the trigger mapping doesn't already exist as a saved object, add it to the list.
      allTriggerActions.push(new TriggerActions(trigger));
      return Promise.resolve();
    }
  });

  await Promise.all(loadDefaultActions);

  return allTriggerActions;
}

export async function addTriggerActions(triggerActions: TriggerActions) {
  const savedObjectsClient = chrome.getSavedObjectsClient();
  let triggerActionsSavedObject: TriggerActionsSavedObject;
  try {
    if (triggerActions.trigger.id) {
      triggerActionsSavedObject = await savedObjectsClient.create<
        TriggerActionsSavedObjectAttributes
      >('ui_trigger', toSavedObjectAttributes(triggerActions), {
        id: triggerActions.trigger.id,
      });
    } else {
      triggerActionsSavedObject = await savedObjectsClient.create<
        TriggerActionsSavedObjectAttributes
      >('ui_trigger', toSavedObjectAttributes(triggerActions));
    }

    return fromSavedObject(triggerActionsSavedObject);
  } catch (e) {
    throw e;
  }
}

async function getActionIdsForTrigger(triggerId: string) {
  const savedObjectsClient = chrome.getSavedObjectsClient();
  const response = await savedObjectsClient.get<TriggerActionsSavedObjectAttributes>(
    'ui_trigger',
    triggerId
  );
  return response.attributes.actions && response.attributes.actions !== ''
    ? response.attributes.actions.split(';')
    : [];
}

export async function saveTriggerActions(triggerActions: TriggerActions) {
  if (!triggerActions.trigger.id) {
    const newEvent = await addTriggerActions(triggerActions);
    triggerActions.trigger.id = newEvent.trigger.id;
  } else {
    chrome
      .getSavedObjectsClient()
      .update('ui_trigger', triggerActions.trigger.id, triggerActions.getSavedObjectAttributes());
  }
}

export async function getDoesTriggerExist({ triggerId }: { triggerId: string; actionId: string }) {
  const response = await chrome
    .getSavedObjectsClient()
    .get<TriggerActionsSavedObjectAttributes>('ui_trigger', triggerId);
  if (response.error && response.error.statusCode === 404) {
    return false;
  } else if (!response.error) {
    return true;
  } else {
    throw new Error(`Unexpected result searching for Event with id ${triggerId}`);
  }
}
