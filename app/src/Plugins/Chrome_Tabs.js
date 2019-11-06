const { exec_applescript } = require('../Applescript');

export default {
  retrieve_items: {
    on_start: async () => {

    },

    on_open: async () => {
      console.log('Onopen chrome tabs');
      const tabs = await exec_applescript(`
        const Chrome = Application('Google Chrome')
        const windows = Chrome.windows()
        const tabs = windows.map(window => {
          return window.tabs().map(tab => {
            return { title: tab.title(), url: tab.url(), tabId: tab.id(), windowId: window.id() };
          })
        })
        return [].concat(...tabs);
      `);

      console.log(`tabs:`, tabs)
      return tabs.map(tab => {
        return {
          icon: { type: 'file', path: '/Applications/Google Chrome.app' },
          uid: tab.url,
          title: tab.title,
          subtitle: tab.url,
          action: { type: 'chrome_tab', windowId: tab.windowId, tabId: tab.tabId },
        };
      });
    },

    on_search: async ({ query }) => {

    },
  }
}
