// @flow

import React from 'react';
import Promise from 'bluebird';
import { flatten } from 'lodash';
const { knowledge_graph_api_key, themoviedb_api_key } = require('../../../app_config.js');

const get_url_for = ({ query }) => {
  const escaped = query.replace(/[ .,?!=&]/g, '+');
  return `https://kgsearch.googleapis.com/v1/entities:search?query=${query}&key=${knowledge_graph_api_key}&limit=3&indent=True`;
};

type CacheFn<T> = (path: string, retrieve: Promise<T>) => Promise<T>

// NOTE WHY IS THIS AN ERROR :'(
// const s = Symbol();
// const {
//   [s]: { arg1, arg2 },
// } = {};

const pre_filter = ({ search }) => {
  return search.length > 3;
}

const simple_match = (search: string, title: string) => {
  console.log(`title:`, title)
  return 1;
  if (title.length === 5) {
    console.log(`title:`, title)
  }
  if (search.length > 3 && title.includes(search)) {
    return title.length;
  } else {
    return -1;
  }
}

export default {
  // item_match_function: simple_match,

  retrieve_items: {
    // on_start: async ({ retrieve_with_cache }: any) => {
    //
    // },

    // on_open: async () => {
    //
    // },

    on_search: async ({ query }: any) => {
      if (query === '') return;

      // if (this.props.search !== prevProps.search) {
      const url = get_url_for({ query: query });
      const response = await fetch(url);
      // if (search === this.props.search) {
      //   // Make sure the search didn't change


      const result = await response.json();
      //   console.log(`KnowledgeGraph result:`, result);
      return result.itemListElement.map(list_element => {
        const item = list_element.result;
        console.log(`item:`, item);
        return {
          uid: item.name,
          title: item.name,
          subtitle: item.description,
          extra_data: { item },
          action: { type: 'feelinglucky', query: item.name },
          icon: {
            type: 'image',
            path: item.image.contentUrl,
          },
        };
      });
    },
  }
}
