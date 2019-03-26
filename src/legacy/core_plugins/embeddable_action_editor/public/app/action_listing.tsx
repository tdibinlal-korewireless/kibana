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

import { i18n } from '@kbn/i18n';
import { FormattedMessage, injectI18n } from '@kbn/i18n/react';
import React, { Fragment } from 'react';
import chrome from 'ui/chrome';

import { EuiButton, EuiEmptyPrompt, EuiLink } from '@elastic/eui';

import { AnyAction, AnyEmbeddable, getActions } from 'ui/embeddable';
import { ActionFactory } from 'ui/embeddable/actions/action_factory';
import { actionFactoryRegistry } from 'ui/embeddable/actions/action_factory_registry';
import { SavedObjectsClient } from 'ui/saved_objects';
// @ts-ignore
import { TableListView } from './../../../kibana/public/table_list_view';
import { CreateNewActionModal } from './create_new_action_modal';

export const EMPTY_FILTER = '';

export interface ActionListingProps {
  onEditAction: (action: AnyAction) => void;
  embeddable?: AnyEmbeddable;
}

interface ActionListingState {
  showCreateModal: boolean;
  actions: AnyAction[];
}

export class ActionListing extends React.Component<ActionListingProps, ActionListingState> {
  private savedObjectsClient: SavedObjectsClient;
  constructor(props: ActionListingProps) {
    super(props);

    this.state = {
      showCreateModal: false,
      actions: [],
    };

    this.savedObjectsClient = chrome.getSavedObjectsClient();
  }

  public async componentDidMount() {
    const actions = await getActions();
    this.setState({ actions });
  }

  public getItems = () => ({
    hits: this.state.actions,
  });

  public render() {
    return (
      <div>
        {this.state.showCreateModal && this.renderCreateModal()}
        <TableListView
          createItem={this.showCreateModal}
          findItems={this.getItems}
          deleteItems={this.deleteItems}
          editItem={this.editItem}
          tableColumns={this.getTableColumns()}
          listingLimit={10}
          initialFilter=""
          hideWriteControls={false}
          noItemsFragment={this.getNoItemsMessage()}
          entityName={i18n.translate('kbn.dashboard.listing.table.entityName', {
            defaultMessage: 'action',
          })}
          entityNamePlural={i18n.translate('kbn.dashboard.listing.table.entityNamePlural', {
            defaultMessage: 'actions',
          })}
          tableListTitle={i18n.translate('kbn.dashboard.listing.dashboardsTitle', {
            defaultMessage: 'Actions',
          })}
        />
      </div>
    );
  }

  public getNoItemsMessage() {
    return (
      <div>
        <EuiEmptyPrompt
          iconType="dashboardApp"
          title={
            <h2>
              <FormattedMessage
                id="kbn.dashboard.listing.createNewDashboard.title"
                defaultMessage="Create your first action"
              />
            </h2>
          }
          body={
            <Fragment>
              <p>
                <FormattedMessage
                  id="kbn.dashboard.listing.createNewDashboard.combineDataViewFromKibanaAppDescription"
                  defaultMessage="You can combine data views from any Kibana app into one dashboard and see everything in one place."
                />
              </p>
              <p>
                <FormattedMessage
                  id="kbn.dashboard.listing.createNewDashboard.newToKibanaDescription"
                  defaultMessage="New to Kibana? {sampleDataInstallLink} to take a test drive."
                  values={{
                    sampleDataInstallLink: (
                      <EuiLink href="#/home/tutorial_directory/sampleData">
                        <FormattedMessage
                          id="kbn.dashboard.listing.createNewDashboard.sampleDataInstallLinkText"
                          defaultMessage="Install some sample data"
                        />
                      </EuiLink>
                    ),
                  }}
                />
              </p>
            </Fragment>
          }
          actions={
            <EuiButton
              onClick={this.showCreateModal}
              fill
              iconType="plusInCircle"
              data-test-subj="createDashboardPromptButton"
            >
              <FormattedMessage
                id="kbn.dashboard.listing.createNewDashboard.createButtonLabel"
                defaultMessage="Create new action"
              />
            </EuiButton>
          }
        />
      </div>
    );
  }

  public getTableColumns() {
    const tableColumns = [
      {
        field: 'title',
        name: i18n.translate('kbn.dashboard.listing.table.titleColumnName', {
          defaultMessage: 'Title',
        }),
        sortable: true,
        render: (field: string, record: AnyAction) => (
          <EuiButton
            onClick={() => this.props.onEditAction(record)}
            data-test-subj={`actionListingTitleLink-${record.title.split(' ').join('-')}`}
          >
            {field}
          </EuiButton>
        ),
      },
      {
        field: 'embeddableId',
        name: i18n.translate('kbn.dashboard.listing.table.descriptionColumnName', {
          defaultMessage: 'Applies to',
        }),
        sortable: true,
        render: (field: string, record: AnyAction) => {
          return record.embeddableId || record.embeddableType || 'Global';
        },
      },
      {
        field: 'description',
        name: i18n.translate('kbn.dashboard.listing.table.descriptionColumnName', {
          defaultMessage: 'Description',
        }),
        sortable: true,
        dataType: 'string',
      },
      {
        field: 'type',
        name: i18n.translate('kbn.dashboard.listing.table.descriptionColumnName', {
          defaultMessage: 'Type',
        }),
        sortable: true,
        dataType: 'string',
      },
    ];
    return tableColumns;
  }

  private editItem = (item: AnyAction) => {
    this.props.onEditAction(item);
  };

  private showCreateModal = () => {
    this.setState({ showCreateModal: true });
  };

  private closeModal = () => {
    this.setState({ showCreateModal: false });
  };

  private renderCreateModal = () => {
    return (
      <CreateNewActionModal onClose={this.closeModal} onCreate={this.createActionFromFactory} />
    );
  };

  private createActionFromFactory = (type: string) => {
    this.createItem(type);
    this.closeModal();
  };

  private createItem = async (type: string) => {
    const factory = actionFactoryRegistry.getFactoryById(type);
    const action = await factory.createNew();
    if (action) {
      this.props.onEditAction(action);
    }
  };

  private deleteItems = (ids: string[]) => {
    ids.forEach(id => this.savedObjectsClient.delete('ui_action', id));
  };
}

// export const ActionListing = injectI18n(ActionListingUi);
