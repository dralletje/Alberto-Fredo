// @flow

import React from 'react';
import ReactDOM from 'react-dom';
import './styles/global.css';
import Promise from 'bluebird';
import open_file from 'open';
import { range } from 'lodash';
import osascript from 'osascript';

import DraggingLayer from './DragndropLayer';
import DocumentEvent from './DocumentEvent';
import SearchWindow from './SearchWindow';
import { Flex, Component, View, Space, precondition } from './Elements';
import { Window, get_image_url_for_path, icons_cache, ipcRenderer, remote } from './Electron';
import { clipboard } from 'electron';

const exec_applescript = script => {
  return new Promise((yell, cry) => {
    const real_script = `
      const main = () => {
        ${script}
      }
      JSON.stringify(main() || []);
    `;
    osascript.eval(real_script, (err, result) => {
      if (err) {
        cry(err);
      } else {
        yell(JSON.parse(result)[0]);
      }
    });
  });
};

type T_Icon = { type: 'file' | 'image', path: string };
type T_Action = { type: 'open', path: string } | { type: 'chrome_tab', windowId: number, tabId: number };

type T_match_item = {
  icon: T_Icon,
  uid: string,
  title: string,
  subtitle: string,
  action: T_Action,
};

type T_File_Icon_Image_Props = {
  icon: T_Icon,
};
class File_Icon_Image extends React.Component<T_File_Icon_Image_Props, { base64: ?string }> {
  state = {
    base64: icons_cache.get(this.props.icon.path),
  };

  componentDidMount() {
    const { icon } = this.props;
    const { base64 } = this.state;

    if (icon.type === 'file' && base64 == null) {
      setTimeout(() => {
        const base64 = get_image_url_for_path(icon.path);
        setTimeout(() => {
          this.setState({ base64 });
        }, 10);
      }, 10);
    }
  }

  render() {
    const { icon, ...props } = this.props;
    const { base64 } = this.state;

    if (icon.type === 'file' && base64 == null) {
      // TODO Placeholder image
      return <div {...props} />;
    } else {
      return <img src={icon.type === 'file' ? base64 : icon.path} {...props} />;
    }
  }
}

const fuzzy_match_score = (string, search) => {
  let search_index = 0;
  let first_occurence = 0;

  for (let index of range(string.length)) {
    if (string[index] === search[search_index]) {
      search_index = search_index + 1;
      if (first_occurence == null) {
        first_occurence = index;
      }
    }

    if (search_index === search.length) {
      const new_word_bonus = string[first_occurence - 1] == null || string[first_occurence - 1] === ' ' ? -30 : 0;
      const first_occurence_bonus = first_occurence / 10;
      return index - first_occurence + new_word_bonus + first_occurence_bonus;
    }
  }

  return -1;
};

const fuzzy_search = ({ previous_result, array, key_selector, search }) => {
  if (search === '') {
    return { search, items: array };
  }

  const search_lowercase = search.toLowerCase();
  const items = array
    .map(item => {
      const key = key_selector(item).toLowerCase();
      const score = fuzzy_match_score(key, search_lowercase);

      return {
        score: score,
        item: item,
      };
    })
    .filter(x => x.score !== -1)
    .sort((a, b) => a.score - b.score)
    .map(x => x.item);

  return { search: search_lowercase, items };
};

type T_textinput_props = {
  style: any,
  value: string,
  onChangeText?: (value: string) => void,
};
class TextInput extends React.Component<T_textinput_props> {
  render() {
    const { style, value, onChangeText, ...props } = this.props;
    return (
      <input
        {...props}
        style={style}
        type="text"
        value={value}
        onChange={e => {
          onChangeText && onChangeText(e.target.value);
        }}
      />
    );
  }
}

class MatchItem extends React.Component<{ item: T_match_item, selected: boolean }> {
  render() {
    const { item, selected, ...props } = this.props;

    return (
      <Flex
        draggable="true"
        row
        {...props}
        style={{
          backgroundColor: selected ? 'rgba(255,255,255,0.3)' : 'transparent',
          borderBottom: `1px solid rgba(0,0,0,.02)`,
        }}
      >
        <File_Icon_Image
          icon={item.icon}
          style={{
            margin: 10,
            height: 40,
            minWidth: 40,
          }}
        />

        <Flex
          column
          style={{
            justifyContent: 'center',
          }}
        >
          <Flex
            row
            style={{
              color: selected ? '#4E585C' : '#7E848C',
              fontSize: 24,
              fontFamily: 'BlinkMacSystemFont',
              fontWeight: 300,
            }}
          >
            {item.title}
          </Flex>
          <Flex
            row
            style={{
              color: selected ? '#6D777B' : '#91979F',
              fontSize: 11,
              fontFamily: 'BlinkMacSystemFont',
              fontWeight: 300,
            }}
          >
            {item.subtitle}
          </Flex>
        </Flex>
      </Flex>
    );
  }
}

type T_file = {
  path: string,
  name: string,
};
type T_app_state = {
  search: string,
  entries: Array<T_match_item>,
  selected_index: number,
  dragging: boolean,
  dropped: Array<T_file>,
  currently_running: Array<string>,
  chrome_tabs: Array<T_match_item>,

  window_open: boolean,
  current_clipboard: ?string,
};
export default class App extends React.Component<{}, T_app_state> {
  state = {
    search: '',
    entries: [],
    selected_index: 0,
    dragging: false,
    dropped: [],
    currently_running: [],
    chrome_tabs: [],

    window_open: false,
    current_clipboard: null,
  };

  async componentDidMount() {
    ipcRenderer.on('entries', (_, entries) => {
      this.setState({
        entries: entries.map(entry => {
          return {
            ...entry,
            action: { type: 'open', path: entry.open_path },
          };
        }),
      });
    });

    exec_applescript(`
      const Chrome = Application('Google Chrome')
      const windows = Chrome.windows()
      const tabs = windows.map(window => {
        return window.tabs().map(tab => {
          return { title: tab.title(), url: tab.url(), tabId: tab.id(), windowId: window.id() };
        })
      })
      return tabs;
    `).then(tabs => {
      this.setState({
        chrome_tabs: tabs.map(tab => {
          return {
            icon: { type: 'file', path: '/Applications/Google Chrome.app' },
            uid: tab.url,
            title: tab.title,
            subtitle: tab.url,
            action: { type: 'chrome_tab', windowId: tab.windowId, tabId: tab.tabId },
          };
        }),
      });
    });
    ipcRenderer.on('currently_running', (_, currently_running) => {
      this.setState({ currently_running });
    });
  }

  componentDidUpdate(_, prevState) {
    if (prevState.window_open !== this.state.window_open) {
      if (this.state.window_open === false) {
        this.setState({ search: '' });
      } else {
        console.log('READ IMAGE');
        this.setState({ current_clipboard: clipboard.readImage() });
      }
    }
  }

  render() {
    const {
      search,
      entries,
      selected_index,
      dragging,
      current_clipboard,
      dropped,
      currently_running,
      window_open,
      chrome_tabs,
    } = this.state;

    const matching_apps =
      search === ''
        ? {
            items: currently_running
              .map(x => {
                return entries.find(y => y.action.type === 'file' && x === y.action.path);
              })
              .filter(Boolean),
          }
        : fuzzy_search({
            array: [...entries, ...chrome_tabs],
            key_selector: x => x.title,
            search: search,
          });

    const open_item = item => {
      if (item.action.type === 'open') {
        open_file(item.action.path);
        this.setState({ window_open: false });
      } else if (item.action.type === 'chrome_tab') {
        const { windowId, tabId } = item.action;
        exec_applescript(`
          Chrome = Application('Google Chrome')
          ChromeWindow = Chrome.windows.byId(${windowId})
          index = ChromeWindow.tabs().findIndex(x => x.id() === ${tabId}) + 1
          ChromeWindow.activeTabIndex = index
          ChromeWindow.index = 1
          Chrome.activate()
        `);
        this.setState({ window_open: false });
      }
    };

    return (
      <SearchWindow open={window_open} onOpenChange={new_open => this.setState({ window_open: new_open })}>
        <DraggingLayer
          onDraggingChange={dragging => {
            this.setState({ dragging });
          }}
          dragging={dragging}
          onDrop={transfer_item => {
            this.setState(state => ({ dropped: [...state.dropped, transfer_item] }));
          }}
        />

        <DocumentEvent
          name="keyDown"
          passive
          handler={async e => {
            if (e.which === 70 && e.metaKey) {
              // Start browser - do CDM+F
            }
          }}
        />

        <Flex style={{ flex: 1, filter: dragging ? `blur(5px)` : ``, pointerEvents: dragging ? 'none' : 'auto' }}>
          <TextInput
            style={{
              flex: 1,
              height: 80,
              padding: 10,
              paddingLeft: 20,
              backgroundColor: 'transparent',
              fontSize: 36,
              fontFamily: 'BlinkMacSystemFont',
              color: `#384043`,
              padding: '0 10px',
              fontWeight: 300,
            }}
            onBlur={e => {
              e.target.focus();
            }}
            onKeyDown={e => {
              if (e.which === 13) {
                // Enter
                const first_app = matching_apps.items[0];
                if (first_app) {
                  open_item(first_app);
                }
              }
              if (e.which === 27) {
                // Escape TODO Move to SearchWindow
                this.setState({ window_open: false });
              }
            }}
            autoFocus
            value={search}
            onChangeText={text => {
              this.setState({ search: text.toLowerCase(), selected_index: 0 });
            }}
          />

          {matching_apps[selected_index] == null && (
            <Component
              did_mount={() => {
                this.setState({ selected_index: 0 });
              }}
            />
          )}

          <Flex
            column
            style={{
              padding: 10,
              paddingTop: 0,
              display: matching_apps.length === 0 ? 'none' : 'block',
            }}
          >
            {matching_apps.items.slice(0, 5).map((x, i) => (
              <MatchItem
                key={x.uid}
                item={x}
                selected={i === selected_index}
                onClick={() => {
                  open_item(x);
                }}
                onMouseOver={() => {
                  this.setState({
                    selected_index: i,
                  });
                }}
              />
            ))}
          </Flex>

          {search === '' &&
            dropped.length === 0 && (
              <Flex
                row
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',

                  fontSize: 12,
                  color: '#777',
                }}
              >
                <Flex style={{ padding: 5, marginBottom: 10, border: `2px dashed rgb(197, 197, 197)` }}>
                  Drop files for quick access
                </Flex>
              </Flex>
            )}

          <Flex
            row
            style={{
              display: search === '' ? 'flex' : 'none',
              overflowX: 'auto',
              WebkitMaskImage: `linear-gradient(90deg, transparent 0%, black 40px, black, transparent),linear-gradient(-90deg, transparent 0%, black 40px, black, transparent)`,
            }}
          >
            <Space width={10} />
            {dropped.map(file => (
              <Flex
                title={file.path}
                onMouseDown={event => {
                  event.preventDefault();
                  ipcRenderer.send('ondragstart', file.path);
                  this.setState({ window_open: false });
                }}
                column
                style={{
                  alignItems: 'center',
                  borderRight: `solid 1px rgba(0,0,0,.05)`,
                  paddingLeft: 20,
                  paddingRight: 20,
                }}
                key={file.path}
              >
                <Flex
                  style={{
                    width: 100,
                    height: 100,
                    margin: 10,
                    alignItems: 'stretch',
                    position: 'relative',
                  }}
                >
                  <Flex
                    onMouseDown={event => {
                      event.stopPropagation();
                    }}
                    onClick={() => {
                      this.setState({
                        dropped: dropped.filter(x => x !== file),
                      });
                    }}
                    style={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      width: 25,
                      height: 25,
                      backgroundColor: 'rgba(210, 210, 210, 1)',
                      borderRadius: 15,
                      zIndex: 20,

                      alignItems: 'center',
                      justifyContent: 'center',
                      color: `rgb(117, 117, 117)`,
                    }}
                    css={{
                      opacity: 0.7,
                      ':hover': {
                        cursor: 'pointer',
                        opacity: 1,
                      },
                    }}
                  >
                    x
                  </Flex>

                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      border: `dashed 2px rgba(0,0,0,.3)`,
                    }}
                  />

                  <div
                    style={{
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      flex: 1,
                      backgroundImage: `url("${file.path.match(/(\.png|\.jpg)/)
                        ? file.path
                        : get_image_url_for_path(file.path)}")`,
                      zIndex: 10,
                    }}
                  />
                </Flex>

                <span
                  style={{
                    fontSize: 11,
                    fontFamily: `BlinkMacSystemFont`,
                    width: 120,
                    color: `rgba(0,0,0,.7)`,
                  }}
                >
                  {file.name}
                </span>
                <Space height={10} />
              </Flex>
            ))}
            <Space width={10} />
          </Flex>
        </Flex>
      </SearchWindow>
    );
  }
}
