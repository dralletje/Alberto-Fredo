// @flow
import React from 'react';

import { Flex, Space, G } from './Elements';

const { knowledge_graph_api_key } = require('../../app_config.js');

const get_url_for = ({ query }) => {
  const escaped = query.replace(/[ .,?!=&]/g, '+');
  return `https://kgsearch.googleapis.com/v1/entities:search?query=${query}&key=${knowledge_graph_api_key}&limit=1&indent=True`;
};

class KnowledgeGraph extends React.Component<{ search: string }, { result: ?any }> {
  state = {
    result: null,
  };

  async load(prevProps: { search: string }) {
    const { search } = this.props;
    if (search === '') return;

    console.log(`this.props, prevProps:`, this.props, prevProps)
    if (this.props.search !== prevProps.search) {
      console.log('== Doing search');
      const search = this.props.search;
      const url = get_url_for({ query: search });
      const response = await fetch(url);
      console.log(`>> search:`, search, this.props.search);
      if (search === this.props.search) {
        // Make sure the search didn't change
        const result = await response.json();
        console.log(`== result:`, result);
        this.setState({
          result: result,
        });
      }
    }
  }

  componentDidMount() {
    this.load({ search: '' })
  }

  componentDidUpdate(prevProps: { search: string }) {
    this.load(prevProps)
  }

  render() {
    const { search } = this.props;
    const { result } = this.state;

    const item_result = result && result.itemListElement && result.itemListElement[0];

    const MINIMAL_RESULT_SCORE = 100;
    // const MINIMAL_RESULT_SCORE = 50;

    if (!item_result || item_result.resultScore < MINIMAL_RESULT_SCORE) {
      return null;
    } else {
      const item = item_result.result;
      return (
        <Flex row style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 20 }}>
          {item.image && (
            <div
              style={{
                minWidth: 60,
                height: 60,
                borderRadius: 30,
                marginTop: 5,
                backgroundImage: `url("${item.image.contentUrl}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}

          <Space width={20} />

          <Flex column>
            <Flex style={{ fontSize: 32 }}>{item.name}</Flex>
            <Space height={5} />
            <Flex row  style={{ fontWeight: '100', fontSize: 16 }}>
              <span>{item.description}</span>
              <Space width={10} />
              <a href={item.url} style={{ color: '#313261' }}>{item.url}</a>
            </Flex>

            {item.detailedDescription && (
              <G>
                <Space height={10} />
                <Flex style={{ fontSize: 16 }}>
                  <span>{item.detailedDescription.articleBody}
                  <a href={item.detailedDescription.url}> {item.detailedDescription.url}</a></span>
                </Flex>
              </G>
            )}
          </Flex>
        </Flex>
      );
    }
  }
}

export default KnowledgeGraph;
