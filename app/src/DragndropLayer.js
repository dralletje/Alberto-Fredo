import React from 'react';

import DocumentEvent from './DocumentEvent';
import { Flex, precondition } from './Elements';

const get_as_string_async = item => {
  return new Promise((yell, cry) => {
    item.getAsString(y => {
      yell(y);
    });
  });
};

const DragndropLayer = ({ onDraggingChange, dragging, onDrop }) => {
  return (
    <Flex
      style={{
        pointerEvents: dragging ? 'all' : 'none',
        alignItems: 'stretch',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,.7)',
        opacity: dragging ? 1 : 0,
      }}
      onDragLeave={() => {
        onDraggingChange(false);
      }}
    >
      <DocumentEvent
        name="dragenter"
        handler={() => {
          onDraggingChange(true);
        }}
      />

      <DocumentEvent
        name="dragover"
        handler={ev => {
          ev.preventDefault();
        }}
      />

      <DocumentEvent
        name="drop"
        handler={async ev => {
          ev.preventDefault();

          // Smaller index is better
          const drop_priorities = [
            'text/uri-list',
            'text/plain',
          ]

          if (ev.dataTransfer.files.length !== 0) {
            // TODO Group files into one "thing"
            onDraggingChange(false);
            const files = [...ev.dataTransfer.files];
            files.forEach(file => onDrop(file));
          } else {
            const items = [...ev.dataTransfer.items];
            const items_left = await Promise.all(
              items
              .filter(x => drop_priorities.includes(x.type))
              .sort((a, b) => drop_priorities.indexOf(a.type) - drop_priorities.indexOf(b.type))
              .map(async item => {
                precondition(item.kind === 'string', `Files?!`);
                return {
                  kind: 'string',
                  type: item.type,
                  string: await get_as_string_async(item),
                };
              })
            )

            if (items_left.length === 0) {
              console.warn(`No suitable entries found in `, ev.dataTransfer);
            } else {
              const item = items_left[0];
              console.log(`item:`, item)
              // TODO Allowing simple drags
              // this.setState({ dropped: [...dropped, item] });
              onDraggingChange(false);
            }
          }
        }}
      />

      <Flex
        style={{
          pointerEvents: 'none',
          margin: 20,
          flex: 1,
          height: '100%',
          border: 'dashed 10px rgba(255,255,255,.3)',
        }}
      />
    </Flex>
  )
}

export default DragndropLayer;
