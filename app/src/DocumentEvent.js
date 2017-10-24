/*
Simple component that will not render anything.
On mount it will bind to a document event, and it will clean up on unmount
<DocumentEvent
  name="scroll"
  handler={updateScrollPosition}
/>
@flow
*/

import React from 'react';

type T_documentevent_props = {
  handler: (e: any) => mixed,
  name: string,
  passive?: boolean,
}
class DocumentEvent extends React.Component<T_documentevent_props> {
  unbind: () => void;

  componentDidMount() {
    let fn = (e) => {
      if (!this.props.passive)
        e.preventDefault();
      this.props.handler(e);
    }
    document.addEventListener(this.props.name, fn);
    this.unbind = () => {
      document.removeEventListener(this.props.name, fn);
    }
  }

  componentWillUnmount() {
    this.unbind();
  }

  render() {
    return null;
  }
}

export default DocumentEvent;
