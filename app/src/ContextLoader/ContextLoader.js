/*
NOTE Proof of concept - Do not use outside of Spotlight-Turbo for now

This stuff should be implemented in a deeper, React-ish way to be effecient and
mathematically correct. I am working on it, but this is a workaround that /should/ work only
when you are using one stable provider component.
Switching or nesting providers is not in the scope, might not even warn, sorry

--
Biggest obstacle with this approach is the inability to nest elements right now
*/

import React from 'react';
import PropTypes from 'prop-types';

const context_type = {
  get_attention: PropTypes.func,
};

const ipcRenderer = require('electron').ipcRenderer;

type Id = number;
type T_Attention = {};

export class ContextchildProvider extends React.Component {
  static childContextTypes = context_type;

  next_id: Id = 1;
  items: Map<Id, any> = new Map();

  changes: Map<Id, any> = new Map();

  provide_attention = () => {
    console.log('GENERATING NEW ID')
    const id = this.next_id;
    this.next_id = this.next_id + 1;

    return {
      update: next_value => {
        this.changes.set(id, { type: 'set', value: next_value });
        this.items.set(id, next_value);
      },
      remove: () => {
        this.changes.set(id, { type: 'delete' });
        this.items.delete(id);
      },
    };
  };

  getChildContext() {
    return {
      get_attention: this.provide_attention,
    };
  }

  componentDidMount() {
    ipcRenderer.send('render_images', {
      images: [...this.changes.entries()],
    });
    this.changes = new Map();
  }

  componentDidUpdate() {
    ipcRenderer.send('render_images', {
      images: [...this.changes.entries()],
    });
    this.changes = new Map();
  }

  render() {
    return this.props.children;
  }
}

export class ContextChild extends React.Component {
  static contextTypes = context_type;

  counter = 1;

  componentDidMount() {
    this.attention = this.context.get_attention();
    this.attention.update(this.props.onMount());

    this.counter = this.counter + 1;
  }

  componentDidUpdate() {
    this.attention.update(this.props.onMount());
    this.counter = this.counter + 1;
  }

  componentWillUnmount() {
    this.attention.remove();
  }

  render() {
    console.log(`this.context:`, this.context);
    return this.props.children || null;
  }
}
