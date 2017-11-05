// @flow

import React from 'react';
import ReactDOM from 'react-dom';
import './styles/global.css';
import Promise from 'bluebird';
import open_file from 'open';
import fs_non_promise from 'fs';
import { range, flatten } from 'lodash';
import { Map } from 'immutable';

import DraggingLayer from './DragndropLayer';
import DocumentEvent from './DocumentEvent';
import SearchWindow from './SearchWindow';
import MathResult from './MathResult';
// import KnowledgeGraph from './KnowledgeGraph';
import { exec_applescript } from './Applescript';

import { Result_Medium } from './ResultsList';

import { Flex, Component, View, Space, precondition, DelayRepeatedRender, TextInput } from './Elements';
import { Window, File_Icon_Image, ipcRenderer, remote } from './Electron';
import { IconImage } from './IconImage';
import { clipboard } from 'electron';

import Apps_Plugin from './Plugins/Apps';
import Chrometabs_Plugin from './Plugins/Chrome_Tabs';
import Homebrew_Plugin from './Plugins/Homebrew';

const fs = Promise.promisifyAll(fs_non_promise);


try {
  fs.mkdirSync('./.cache')
} catch (e) {}

class FeelingLucky extends React.Component<{search : string}> {
  async load() {
    const { search } = this.props;
    const response = await fetch(`http://www.google.com/search?&sourceid=navclient&btnI=I&q=${encodeURI(search)}`, {
      method: 'get',
      headers: {
        referer: 'https://www.google.com/'
      },
    });

    const redirect_url = response.url;
    console.log(`redirect_url:`, redirect_url);
    if (redirect_url.match(/https?:\/\/(www\.)?google\.[a-z]+\/search/)) {
      return;
    }

    const text = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    console.log(`redirect_url:`, redirect_url);
    console.log(`doc:`, doc);

    const meta_tags = Array.from(doc.querySelectorAll('meta'));
    const title_tag = doc.querySelector('title');
    const link_tags = Array.from(doc.querySelectorAll('link'));

    const valid_meta = [{
      source: 'name',
      value: 'description',
      type: 'description',
    }, {
      source: 'property',
      value: 'og:description',
      type: 'description',
    }, {
      source: 'name',
      value: 'keywords',
      type: 'keywords',
    }, {
      source: 'property',
      value: 'og:image',
      type: 'image',
    }, {
      source: 'property',
      value: 'og:url',
      type: 'url',
    }, {
      source: 'property',
      value: 'og:type',
      type: 'type',
    }, {
      source: 'property',
      value: 'og:site_name',
      type: 'site-name',
    }, {
      source: 'name',
      value: 'title',
      type: 'title',
    }]
    const info = meta_tags.map(tag => {
      return {
        name: tag.name,
        itemprop: tag.getAttribute('itemprop'),
        property: tag.getAttribute('property'),
        content: tag.getAttribute('content'),
        tag: tag,
      }
    })
    .filter(x => x.name || x.itemprop || x.property);
    const title = title_tag && title_tag.innerHTML;

    const valid_rel = ['icon', 'shortcut icon', 'apple-touch-icon', 'search', 'image_src'];
    const link_info = link_tags.filter(x => valid_rel.includes(x.getAttribute('rel')))

    console.log(`link_info:`, link_info)
    console.log(`info:`, info)
    console.log(`title:`, title)
  }

  async componentDidMount() {
    this.load();
  }

  async componentDidUpdate() {
    this.load()
  }

  render() {
    return (
      <Flex>

      </Flex>
    )
  }
}

const rotate = (num, around_num) => {
  const relative = num % around_num;
  if (relative < 0) {
    return around_num + relative; // (relative is negative here)
  } else {
    return relative;
  }
}

type T_Icon = { type: 'file' | 'image', path: string };
type T_Action = { type: 'open', path: string } | { type: 'chrome_tab', windowId: number, tabId: number };

type T_match_item = {
  icon: T_Icon,
  uid: string,
  title: string,
  subtitle: string,
  action: T_Action,
};

const fuzzy_match_score = (search, string) => {
  let search_index = 0;
  let first_occurence = 0;

  for (let index of range(string.length)) {
    if (string[index] === search[search_index]) {
      search_index = search_index + 1;
      if (first_occurence === 0) {
        first_occurence = index;
      }
    }

    if (search_index === search.length) {
      const new_word_penalty = string[first_occurence - 1] == null || string[first_occurence - 1] === ' ' ? 0 : 10;
      const first_occurence_penalty = first_occurence / 10;
      return new_word_penalty + first_occurence_penalty;
    }
  }

  return -1;
};

const fuzzy_search = ({ previous_result, array, key_selector, search, item_match_function = fuzzy_match_score }) => {
  if (search === '') {
    return { search, items: array };
  }

  const search_lowercase = search.toLowerCase();
  const items = array
    .map(item => {
      const key = key_selector(item).toLowerCase();
      const score = item_match_function(search_lowercase, key);

      return {
        score: score,
        item: item,
      };
    })
    .filter(x => x.score !== -1)
    .sort((a, b) => a.score - b.score)
    .map(x => ({
      ...x.item,
      title: `${x.item.title} (${x.score})`,
    }));

  return { search: search_lowercase, items };
};


class MatchItem extends React.Component<{ item: T_match_item, selected: boolean }> {
  render() {
    const { item, selected, ...props } = this.props;

    return (
      <Result_Medium
        render_icon={
          <IconImage
            icon={item.icon}
            height={40}
            width={40}
          />
        }
        title={item.title}
        subtitle={item.subtitle}
        selected={selected}
      />
    );
  }
}

const normalize_search_query = (query) => {
  return query.toLowerCase().replace(/\s+/g, ' ');
}

const retrieve_with_cache = async (file, retrieve) => {
  const optional = async (promise) => {
    try {
      const result = await promise;
      return { success: true, result, error: null };
    } catch (e) {
      return { success: false, result: null, error: e };
    }
  }

  const cache_path = `./.cache/${file}`;
  const file_result = await optional(fs.readFileAsync(cache_path).then(x => JSON.parse(x.toString())));

  if (file_result.success) {
    return file_result.result.data;
  } else {
    console.log(`Fetching for '${file}'`);
    const data = await retrieve();
    const writen = await fs.writeFileAsync(cache_path, JSON.stringify({
      weather: `Beautiful`,
      data: data,
      fetch_date: Date.now(),
    }));
    return data;
  }
}

type T_plugin_usage = any;
const plugins: Array<T_plugin_usage> = [{
  plugin: Chrometabs_Plugin,
  priority: 2,
}, {
  plugin: Apps_Plugin,
  priority: 1,
}, {
  plugin: Homebrew_Plugin,
  priority: 3,
}];

type T_file = {
  path: string,
  name: string,
};
type T_app_state = {
  search: string,
  entries_map: Map<T_plugin_usage, Array<any>>,
  selected_index: number,
  dragging: boolean,
  dropped: Array<T_file>,
  currently_running: Array<string>,

  window_open: boolean,
  current_clipboard: ?string,
};
export default class App extends React.Component<{}, T_app_state> {
  state = {
    search: '',
    entries_map: Map(plugins.map(x => [x, []])),
    selected_index: 0,
    dragging: false,
    dropped: [],
    currently_running: [],
    chrome_tabs: [],

    window_open: false,
    current_clipboard: null,
  };

  async componentDidMount() {
    Promise.map(plugins, async plugin => {
      const on_start = plugin.plugin.retrieve_items.on_start;
      if (typeof on_start === 'function') {
        const items = await on_start({ retrieve_with_cache });
        if (Array.isArray(items)) {
          this.setState({ entries_map: this.state.entries_map.set(plugin, items) });
        }
      }
    });
  }

  componentDidUpdate(_: mixed, prevState: { window_open: boolean }) {
    if (prevState.window_open !== this.state.window_open) {
      if (this.state.window_open === false) {
        this.setState({ search: '' });
      } else {
        // This is when window receives focus:
        // - Get current clipboard value
        // - Get currently running applications
        // - Get currently open chrome tabs

        Promise.map(plugins, async plugin => {
          const on_open = plugin.plugin.retrieve_items.on_open;
          if (typeof on_open === 'function') {
            const items = await on_open({ retrieve_with_cache });
            if (Array.isArray(items)) {
              console.log(`plugin:`, plugin)
              this.setState({ entries_map: this.state.entries_map.set(plugin, items) });
            }
          }
        });

        // this.setState({ current_clipboard: clipboard.readImage() });

        exec_applescript(`return Application("System Events").processes.where({ backgroundOnly: false })().map(process => process.file().posixPath())`)
        .then((currently_running: any) => {
          this.setState({ currently_running });
        });
      }
    }
  }

  render() {
    const {
      search,
      entries_map,
      selected_index,
      dragging,
      current_clipboard,
      dropped,
      currently_running,
      window_open,
    } = this.state;

    const query = normalize_search_query(search);

    // console.log(`Array.from(entries_map.entries()):`, Array.from(entries_map.entries()))

    const all_entries = flatten(
      Array.from(entries_map.entries())
      .sort((a, b) => (a[0].priority || 0) - (b[0].priority || 0))
      .map(([config, items]) => {
        return fuzzy_search({
          array: items,
          key_selector: x => x.title,
          search: query,
          item_match_function: config.plugin.item_match_function,
        }).items;
      })
    )

    const matching_apps =
      search === ''
        ? {
            items: currently_running
              .map(x => {
                return all_entries.find(y => y.action.type === 'open' && x === y.action.path);
              })
              .filter(Boolean),
          }
        : { items: all_entries }

    const open_item = item => {
      if (item.action.type === 'open') {
        open_file(item.action.path);
        this.setState({ window_open: false });
      } else if (item.action.type === 'chrome_tab') {
        const { windowId, tabId } = item.action;
        exec_applescript(`
          Chrome = Application('Google Chrome')
          ChromeWindow = Chrome.windows.byId(${windowId})
          ChromeWindow.index = 1
          Chrome.activate()
          index = ChromeWindow.tabs().findIndex(x => x.id() === ${tabId}) + 1
          ChromeWindow.activeTabIndex = index
        `);
        this.setState({ window_open: false });
      }
    };

    const amount_of_items_showing = Math.min(matching_apps.items.length, 5)

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
              if (e.which === 70 && e.metaKey) {
                this.setState({ window_open: false }, async () => {
                  exec_applescript(`
                    FrontApp = Application('System Events').processes.whose({ frontmost: true }).first()
                    Script = Application(FrontApp.name()).activate()
                    delay(0.2);
                    System = Application('System Events');
                    System.keystroke("f", { using: ['command down'] })
                    delay(0.2);
                    System.keystroke("${search}");
                  `);
                })
              }
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
              if (e.which === 40) {
                // Down arrow
                this.setState({
                  selected_index: rotate(selected_index + 1, amount_of_items_showing),
                })
              }
              if (e.which === 38) {
                // Up Arrow
                this.setState({
                  selected_index: rotate(selected_index - 1, amount_of_items_showing),
                })
              }
            }}
            autoFocus
            value={search}
            onChangeText={text => {
              this.setState({ search: text, selected_index: 0 });
            }}
          />

          {matching_apps[selected_index] == null && (
            <Component
              did_mount={() => {
                this.setState({ selected_index: 0 });
              }}
            />
          )}

          <MathResult
            text={search}
            onTextChange={text => {

            }}
          />

          <Flex
            column
            style={{
              padding: 10,
              paddingTop: 0,
              display: matching_apps.length === 0 ? 'none' : 'block',
            }}
          >
            {matching_apps.items.slice(0, 1).map((x, i) => (
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

          <DelayRepeatedRender delay={200}>
            { query !== '' && <FeelingLucky
              search={query}
            /> }
          </DelayRepeatedRender>

          {/* <DelayRepeatedRender delay={200}>
            { query !== '' && <KnowledgeGraph
              search={query}
            />}
          </DelayRepeatedRender> */}


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

                  <File_Icon_Image
                    type="background"
                    icon={{ type: 'file', path: file.path }}
                    style={{
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      flex: 1,
                      zIndex: 10,
                    }}
                  />
                </Flex>

                <span
                  style={{
                    fontSize: 11,
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
