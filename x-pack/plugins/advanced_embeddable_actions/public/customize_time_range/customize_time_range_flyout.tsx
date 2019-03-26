/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { Component } from 'react';

import { EuiBasicTable, EuiButton, EuiFlyoutBody, EuiFlyoutHeader, EuiTitle } from '@elastic/eui';
import { DashboardContainer } from 'plugins/kibana/dashboard/embeddables';
import { DashboardEmbeddable } from 'plugins/kibana/dashboard/embeddables/dashboard_container';
import {
  addAction,
  deleteAction,
  getActionsForTrigger,
  SHOW_VIEW_MODE_TRIGGER,
  Trigger,
} from 'ui/embeddable';
import {
  addTriggerActionMapping,
  removeTriggerActionMapping,
} from 'ui/embeddable/triggers/trigger_actions_helpers';
import { TimeRange } from 'ui/visualize';
import { AddTimeRange } from './add_time_range';
import { ApplyTimeRangeAction } from './apply_time_range';
import { APPLY_TIME_RANGE } from './apply_time_range_factory';

interface CustomizeTimeRangeProps {
  container: DashboardContainer;
  embeddable: DashboardEmbeddable;
  onClose: () => void;
  panelId: string;
}

interface State {
  timeRangeActions: ApplyTimeRangeAction[];
}

export class CustomizeTimeRangeFlyout extends Component<CustomizeTimeRangeProps, State> {
  private trigger?: Trigger;
  constructor(props: CustomizeTimeRangeProps) {
    super(props);
    this.state = { timeRangeActions: [] };
  }

  public async componentDidMount() {
    const viewModeActions = await getActionsForTrigger(SHOW_VIEW_MODE_TRIGGER, {
      embeddable: this.props.embeddable,
    });

    const timeRangeActions = viewModeActions.filter(
      action => action.type === APPLY_TIME_RANGE
    ) as ApplyTimeRangeAction[];

    this.setState({
      timeRangeActions,
    });
  }

  public render() {
    return (
      <React.Fragment>
        <EuiFlyoutHeader>
          <EuiTitle size="s" data-test-subj="customizePanelTitle">
            <h1>{this.props.embeddable.getOutput().title}</h1>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <AddTimeRange onSave={this.addTimeRange} />
          {this.renderExistingActions()}
        </EuiFlyoutBody>
      </React.Fragment>
    );
  }

  private ensureDefaultTimeRangeOptionExists = async () => {
    let defaultTimeRangeAction = new ApplyTimeRangeAction();
    defaultTimeRangeAction.timeRange = undefined;
    defaultTimeRangeAction.title = 'Use time range from dashboard';
    defaultTimeRangeAction.embeddableId = this.props.embeddable.id;
    defaultTimeRangeAction = await addAction(defaultTimeRangeAction);

    await addTriggerActionMapping({
      triggerId: SHOW_VIEW_MODE_TRIGGER,
      actionId: defaultTimeRangeAction.id,
    });

    const newActions = _.clone(this.state.timeRangeActions);
    newActions.push(defaultTimeRangeAction);
    this.setState({ timeRangeActions: newActions });
  };

  private addTimeRange = async (timeRange: TimeRange) => {
    this.ensureDefaultTimeRangeOptionExists();

    let applyTimeRangeAction = new ApplyTimeRangeAction();
    applyTimeRangeAction.timeRange = timeRange;
    applyTimeRangeAction.title = JSON.stringify(timeRange);
    applyTimeRangeAction.embeddableId = this.props.embeddable.id;
    applyTimeRangeAction = await addAction(applyTimeRangeAction);

    await addTriggerActionMapping({
      triggerId: SHOW_VIEW_MODE_TRIGGER,
      actionId: applyTimeRangeAction.id,
    });

    const newActions = _.clone(this.state.timeRangeActions);
    newActions.push(applyTimeRangeAction);
    this.setState({ timeRangeActions: newActions });
  };

  private renderExistingActions() {
    const columns = [
      {
        field: 'timeRange',
        sortable: false,
        name: 'Time range',
        render: (timeRange: TimeRange) => {
          return JSON.stringify(timeRange);
        },
      },
      {
        field: 'id',
        sortable: false,
        name: 'Remove',
        render: (id: string) => (
          <EuiButton onClick={() => this.removeTimeRange(id)}>Delete</EuiButton>
        ),
      },
    ];
    return <EuiBasicTable columns={columns} items={this.state.timeRangeActions} sorting={{}} />;
  }

  private removeTimeRange = async (id: string) => {
    await removeTriggerActionMapping({ triggerId: SHOW_VIEW_MODE_TRIGGER, actionId: id });
    await deleteAction(id);
  };
}
