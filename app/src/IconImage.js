const React = require('react');
import { Window, File_Icon_Image, ipcRenderer, remote } from './Electron';
import { ContextChild } from './ContextLoader/ContextLoader';

export class IconImage extends React.Component {
  div_size = { height: 0, width: 0, top: 0, left: 0 };

  render() {
    const { height, width, icon } = this.props;
    const is_png_or_jpg = icon.type === 'file' && /(\.png|\.jpe?g)$/.test(icon.path);

    if (icon.type === 'file') {
      return (
          <ContextChild
            onMount={() => {
              console.log(`this.div_size:`, this.div_size);
              console.log(`window.devicePixelRatio:`, window.devicePixelRatio)
              let pixel_ratio = window.devicePixelRatio * 2;
              let result = {
                file: this.props.icon.path,
                height: this.div_size.height * pixel_ratio,
                width: this.div_size.width * pixel_ratio,
                bottom: this.div_size.bottom * pixel_ratio,
                left: this.div_size.left * pixel_ratio,
              };
              console.log(`result:`, result);
              return result;
            }}
          >
            <div
              style={{ height, minHeight: height, width, minWidth: width }}
              ref={ref => {
                console.log(`ref:`, ref)
                this.div_size = ref && ref.getBoundingClientRect()
              }}
            />
        </ContextChild>
      )
    } else {
      return <div />
    }
  }
}
