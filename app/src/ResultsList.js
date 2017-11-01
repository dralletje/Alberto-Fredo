// @flow

import React from 'react';
import { Flex, Space } from './Elements';

type Renderable = any;

export class Result_Medium extends React.Component<{ render_icon?: Renderable, title?: Renderable, subtitle?: Renderable, selected: boolean }> {
  render() {
    const { render_icon, title, subtitle, selected, ...props } = this.props;

    return (
      <Flex
        row
        {...props}
        style={{
          backgroundColor: selected ? 'rgba(255,255,255,0.3)' : 'transparent',
          borderBottom: `1px solid rgba(0,0,0,.02)`,
          overflow: 'hidden',
        }}
      >
        <div style={{ margin: 10 }}>
        {render_icon}
      </div>

        <Flex
          column
          style={{
            flex: 1,
            minWidth: 0,
            justifyContent: 'center',
            WebkitMaskImage: `linear-gradient(-90deg, transparent 0%, black 40px, black)`,
          }}
        >
          <Flex
            row
            className="no-scrollbar"
            style={{
              minWidth: 0,
              color: selected ? '#4E585C' : '#7E848C',
              fontSize: 24,
              fontFamily: 'BlinkMacSystemFont',
              fontWeight: 300,
              whiteSpace: 'nowrap',
              overflow: 'auto',
            }}
          >
            {title}
            <Space width={50} />
          </Flex>
          <Flex
            row
            className="no-scrollbar"
            style={{
              color: selected ? '#6D777B' : '#91979F',
              fontSize: 11,
              fontFamily: 'BlinkMacSystemFont',
              fontWeight: 300,
              whiteSpace: 'nowrap',
              overflow: 'auto',
            }}
          >
            {subtitle}
            <Space width={50} />
          </Flex>
        </Flex>
      </Flex>
    );
  }
}

export class ResultsList extends React.Component<any> {
  render() {
    const { categories } = this.props;

    return (
      <Flex
        column
        style={{
          padding: 10,
          paddingTop: 0,
          display: matching_apps.length === 0 ? 'none' : 'block',
        }}
      >

      </Flex>
    )
  }
}
