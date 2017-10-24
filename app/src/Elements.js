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
