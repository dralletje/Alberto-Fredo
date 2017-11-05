const native_require = global['req' + 'uire'];
const React = require('react');
import { Window, File_Icon_Image, ipcRenderer, remote } from './Electron';
// console.log(`vibrancy:`, vibrancy)


export class IconImage extends React.Component {
  viewId = 0;

  async componentDidMount() {
    const size = this.div_ref.getBoundingClientRect();
    if (this.props.icon.type === 'file') {
      ipcRenderer.send('render_image', {
        Path: this.props.icon.path,
        X: size.left,
        Y: size.bottom,
        Width: size.width,
        Height: size.height,
      });
    }
  }

  render() {
    const { height, width, icon } = this.props;
    const is_png_or_jpg = icon.type === 'file' && /(\.png|\.jpe?g)$/.test(icon.path);

    if (icon.type === 'file') {
      return (
        <div
          style={{ height, minHeight: height, width, minWidth: width, backgroundColor: 'red' }}
          ref={ref => this.div_ref = ref}
        />
      )
    } else {
      return <div />
    }
  }
}
