// @flow

import React from 'react';
import Promise from 'bluebird';
import { flatten } from 'lodash';

const github_api = async ({ url }) => {
  const token = `8d7c5ecba147621087d18b9f1b4db05fc1097355`;

  const prefixed_url =
    url.startsWith(`http`)
    ? url
    : `https://api.github.com${url}`

  const response = await fetch(prefixed_url, {
    headers: {
      Authorization: `token ${token}`
    }
  });

  const result = await response.json();
  return result;
}

const get_user_formulas = async ({ user }: { user: string }) => {
  const repos = await github_api({
    url: `https://api.github.com/users/${user}/repos`,
  });

  const root_trees = flatten(await Promise.map(repos, async repo => {
    const commits = await github_api({
      url: repo.commits_url.replace(/\{\/sha\}/g, ``),
    });
    const tree_url = commits[0].commit.tree.url;
    const tree = await github_api({
      url: tree_url,
    });

    const valid_dirs = ["Formula", "HomebrewFormula", "Casks"];
    const formula_dirs = tree.tree.filter(file => valid_dirs.includes(file.path));
    return flatten(await Promise.all(formula_dirs).map(async dir => {
      const formulas_dir = await github_api({
        url: dir.url,
      });
      return formulas_dir.tree.map(entry => {
        return {
          directory: dir.path,
          user: user,
          repo: repo.name,
          formulas: entry.path,
        };
      });
    }));
  }));

  return root_trees;
};

type CacheFn<T> = (path: string, retrieve: Promise<T>) => Promise<T>

const pre_filter = ({ search }) => {
  return search.length > 3;
}

const simple_match = (search: string, title: string) => {
  if (search.length > 3 && title.includes(search)) {
    return title.length;
  } else {
    return -1;
  }
}

export default {
  item_match_function: simple_match,

  retrieve_items: {
    on_start: async ({ retrieve_with_cache }: any) => {
      const { entries } = await retrieve_with_cache('eu.dral.homebrew_search', async () => {
        const homebrew_entries = await get_user_formulas({ user: 'homebrew' })
        const cask_entries = await get_user_formulas({ user: 'caskroom' })

        const entries = [...cask_entries, ...homebrew_entries];
        return {
          entries: entries,
          fetch_date: Date.now(),
          weather: `Beautiful`,
        };
      });
      const items = entries.map(entry => {
        return {
          match_fn: simple_match,
          uid: `${entry.user}/${entry.repo}/${entry.formulas}`,
          title: entry.formulas,
          subtitle: `${entry.user}/${entry.repo}/${entry.formulas}`,
          action: { type: 'terminal', command: `brew install "${entry.formulas}"` },
          icon: {
            type: 'image',
            path: 'https://brew.sh/img/homebrew-256x256.png',
          },
        };
      });
      return items;
    },

    on_open: async () => {

    },

    on_search: async ({ query }: any) => {

    },
  }
}
