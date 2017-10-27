import React from 'react';
import { Div } from 'glamorous';

export const precondition = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

export const View = ({ innerRef, css, ...props }: { innerRef?: (element: any) => mixed, css?: any }) => {
  if (css) {
    return <Div {...props} css={css} innerRef={innerRef} />;
  } else {
    return <div {...props} ref={innerRef} />;
  }
};

export const Space = ({ width, height }: { width?: number, height?: number }) => {
  return <div style={{ width, height, minWidth: width, minHeight: height }} />;
};

type T_lifecycle_props = {
  did_mount?: () => void,
};
export class Component extends React.Component<T_lifecycle_props> {
  componentDidMount() {
    if (this.props.did_mount) {
      this.props.did_mount();
    }
  }
  render() {
    return null;
  }
}

export const Flex = ({ style, row, column, ...props }: { style?: any, row?: boolean, column?: boolean }) => {
  precondition(!row || !column, `Can't have a flex rowcolumn`);
  return (
    <View
      style={{
        flexDirection: row ? 'row' : 'column',
        display: 'flex',
        ...style,
      }}
      {...props}
    />
  );
};

const no_cache = Symbol();

export class DelayRepeatedRender extends React.Component<{ children: any, delay: number }, { last_children: ?any }> {
  state = {
    saved_children: this.props.children,
  }
  refresh_children_timer: number;

  cache_children() {
    if (this.state.saved_children === this.props.children) {
      return;
    }

    clearTimeout(this.refresh_children_timer);
    this.refresh_children_timer = setTimeout(() => {
      this.setState({
        saved_children: this.props.children,
      })
    }, this.props.delay);
  }

  componentDidMount() {
    this.cache_children();
  }

  componentDidUpdate() {
    this.cache_children();
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  render() {
    console.log(`this.state.saved_children:`, this.state.saved_children)
    return this.state.saved_children;
  }
}

export const G = ({ children }) => {
  return React.Children.map(children, (child, i) => {
    return React.cloneElement(child, {
      key: i,
    })
  })
}
