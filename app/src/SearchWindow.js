// @flow

import React from 'react';

import { Window, IPC } from './Electron';
import DocumentEvent from './DocumentEvent';

import { ContextchildProvider, ContextChild } from './ContextLoader/ContextLoader';

class SearchWindow extends React.Component<{ open: boolean, onOpenChange: (next: boolean) => mixed, children?: any }> {
  componentDidMount() {
    // this.props.onOpenChange(true);
  }

  render() {
    return (
      <ContextchildProvider>
        <Window
          open={this.props.open}
          style={{ width: 620 }}
        >
          <DocumentEvent
            name="keyDown"
            passive
            handler={(e) => {
              if (e.which === 27) {
                this.props.onOpenChange(false);
              }
            }}
          />

          <IPC.Listener
            channel="blur"
            handler={() => {
              this.props.onOpenChange(false);
            }}
          />

          <IPC.Listener
            channel="toggle_search_shortcut"
            handler={() => {
              this.props.onOpenChange(!this.props.open);
            }}
          />

          {this.props.children}
        </Window>
      </ContextchildProvider>
    )
  }
}

export default SearchWindow;
