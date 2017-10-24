// @flow

import React from 'react';

export const remote = require('electron').remote;
export const ipcRenderer = require('electron').ipcRenderer;
const nativeImage = require('electron').nativeImage;

const req = global['req' + 'uire']
const iconImage = req('../electron-icon-image');
import { Flex} from './Elements';

export const icons_cache: Map<string, string> = new Map();

export const get_image_url_for_path = (path_uppercase: string) => {
  const path = path_uppercase.toLowerCase();
  const icon_cached = icons_cache.get(path);
  if (icon_cached) {
    return icon_cached;
  } else {
    console.log('== SLOW')
    const native_icon = nativeImage.createFromBuffer(iconImage.get_icon_for_path(path));
    const icon_url = native_icon.toDataURL();
    icons_cache.set(path, icon_url);
    return icon_url;
  }
}

type T_IPCListener_props = {
  handler: (e: any) => mixed,
  channel: string,
}
export const IPC = {
  Listener: class extends React.Component<T_IPCListener_props> {
    unbind: () => void;

    componentDidMount() {
      let fn = (e) => {
        this.props.handler(e);
      }
      const { channel } = this.props;
      ipcRenderer.on(channel, fn);
      this.unbind = () => {
        ipcRenderer.removeEventListener(channel, fn);
      }
    }

    componentWillUnmount() {
      this.unbind();
    }

    render() {
      return null;
    }
  }
}

export class Window extends React.Component<{ style: any, children: any, open: boolean }> {
  view_ref: HTMLElement;
  pref_bounds = { height: 0, width: 0 };

  sideeffects(prevProps) {
    const { height, width } = this.view_ref.getBoundingClientRect();
    if (this.pref_bounds.height !== height || this.pref_bounds.width !== width) {
      this.pref_bounds = { height, width };

      ipcRenderer.send('resize_me', {
        width: Math.ceil(width),
        height: Math.ceil(height),
        x: Math.round((screen.width - 620) / 2),
        y: Math.round((screen.height - 400) / 2),
      });
    }

    if (prevProps.open !== this.props.open) {
      if (this.props.open === true) {
        remote.getCurrentWindow().show()
      } else {
        // TODO More advanced hiding ;)
        remote.getCurrentWindow().hide();
      }
    }
  }

  componentDidMount() {
    this.sideeffects({ open: false });
  }

  componentDidUpdate(prevProps) {
    this.sideeffects(prevProps);
  }

  render() {
    const { style, children } = this.props;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Flex style={style} children={children} innerRef={ref => (this.view_ref = ref)} />
      </div>
    );
  }
}

export default Window;
