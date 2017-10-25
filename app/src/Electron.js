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

type T_Icon = { type: 'file' | 'image', path: string };
type T_File_Icon_Image_Props = {
  icon: T_Icon,
  style?: any,
  type?: 'image' | 'background'
};
export class File_Icon_Image extends React.Component<T_File_Icon_Image_Props, { base64: ?string }> {
  state = {
    base64: icons_cache.get(this.props.icon.path),
  };
  is_mounted = false;

  componentDidMount() {
    const { icon } = this.props;
    const { base64 } = this.state;
    this.is_mounted = true;

    if (icon.type === 'file' && base64 == null) {
      const is_png_or_jpg = /(\.png|\.jpe?g)$/.test(icon.path);
      if (is_png_or_jpg)
        return;

      setTimeout(() => {
        if (!this.is_mounted) {
          return;
        }
        const base64 = get_image_url_for_path(icon.path);
        setTimeout(() => {
          if (!this.is_mounted) {
            return;
          }
          this.setState({ base64 });
        }, 10);
      }, 10);
    }
  }

  componentWillUnmount() {
    this.is_mounted = false
  }

  render() {
    const { icon, style, type, ...props } = this.props;
    const { base64 } = this.state;
    const is_png_or_jpg = icon.type === 'file' && /(\.png|\.jpe?g)$/.test(icon.path);


    if (icon.type === 'file' && base64 == null && !is_png_or_jpg) {
      // TODO Placeholder image
      return <div style={style} {...props} />;
    } else {
      const source = icon.type === 'file' && !is_png_or_jpg && base64 ? base64 : icon.path;
      if (type === 'background') {
        return <div style={{
          ...style,
          backgroundImage: `url("${source}")`
        }} {...props} />
      }
      return <img style={style} src={source} {...props} />;
    }
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
        y: Math.round((screen.height - 600) / 2),
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
