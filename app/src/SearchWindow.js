// @flow

import React from 'react';

import { Window, IPC } from './Electron';
import DocumentEvent from './DocumentEvent';

class SearchWindow extends React.Component<{ open: boolean, onOpenChange: (next: boolean) => mixed }> {
  componentDidMount() {
    this.props.onOpenChange(true);
  }

  render() {
    return (
      <Window
        open={this.props.open}
        style={{ width: 620 }}
      >
        <DocumentEvent
          name="keyDown"
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
    )
  }
}

export default SearchWindow;
