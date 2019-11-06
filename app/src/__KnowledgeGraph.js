// @flow

/*
This is the old KnowledgeGRaph component, that would fetch the knowledge graph data,
as well as the movie data (if a movie was searched for), and it was presented.
In some way it was nice to have them close, I think it should try to keep that
in whatever implementation I do next: keep the view and the model close.
I hope it's possible to combine it, some way
*/

import React from "react";

import { Flex, Space } from "./Elements";

import { knowledge_graph_api_key, themoviedb_api_key } from '../../app_config.js';

const get_url_for = ({ query }) => {
  const escaped = query.replace(/[ .,?!=&]/g, "+");
  return `https://kgsearch.googleapis.com/v1/entities:search?query=${query}&key=${knowledge_graph_api_key}&limit=3&indent=True`;
};

class MatchItem extends React.Component<any> {
  render() {
    const { render_icon, title, subtitle, selected, ...props } = this.props;

    return (
      <Flex
        row
        {...props}
        style={{
          backgroundColor: selected ? "rgba(255,255,255,0.3)" : "transparent",
          borderBottom: `1px solid rgba(0,0,0,.02)`,
          overflow: "hidden"
        }}
      >
        <div style={{ margin: 10 }}>{render_icon}</div>

        <Flex
          column
          style={{
            flex: 1,
            minWidth: 0,
            justifyContent: "center",
            WebkitMaskImage: `linear-gradient(-90deg, transparent 0%, black 40px, black)`
          }}
        >
          <Flex
            row
            className="no-scrollbar"
            style={{
              minWidth: 0,
              color: selected ? "#4E585C" : "#7E848C",
              fontSize: 24,
              fontFamily: "BlinkMacSystemFont",
              fontWeight: 300,
              whiteSpace: "nowrap",
              overflow: "auto"
            }}
          >
            {title}
            <Space width={50} />
          </Flex>
          <Flex
            row
            className="no-scrollbar"
            style={{
              color: selected ? "#6D777B" : "#91979F",
              fontSize: 11,
              fontFamily: "BlinkMacSystemFont",
              fontWeight: 300,
              whiteSpace: "nowrap",
              overflow: "auto"
            }}
          >
            {subtitle}
            <Space width={50} />
          </Flex>
        </Flex>
      </Flex>
    );
  }
}

const KnowledgeGraph_Item = ({ item }) => {
  return (
    <MatchItem
      selected={false}
      render_icon={
        <div
          style={{
            minWidth: 40,
            height: 40,
            borderRadius: 20,
            marginTop: 5,
            backgroundColor: `#c7c7c7`,
            backgroundImage: item.image
              ? `url("${item.image.contentUrl}")`
              : "",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
      }
      title={item.name}
      subtitle={item.description}
    />
  );
};

class KnowledgeGraph extends React.Component<
  { search: string },
  { result: ?any, movie_result: ?any }
> {
  state = {
    result: null,
    movie_result: null
  };

  async load(prevProps: { search: string }) {
    if (this.props.search === "") return;

    if (this.props.search === prevProps.search) {
      return
    }

    const search = this.props.search;
    const url = get_url_for({ query: search });
    const response = await fetch(url);

    // Make sure the search didn't change while waiting for the request
    if (search !== this.props.search) {
      return
    }
    const result = await response.json();

    // Update the result
    this.setState({
      result: result,
      movie_result: null
    });

    // Now check if there is a movie in there
    // return result.itemListElement.map(list_element => {
    //   const item = list_element.result;
    //   return {};
    // });
    // item.image.contentUrl;

    const movie_result_container =
      result.itemListElement &&
      result.itemListElement[0];

    if (movie_result_container && movie_result_container.resultScore > 20) {
      const movie_result = movie_result_container.result;
      if (movie_result && movie_result["@type"].includes("Movie")) {
        const reponse = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${themoviedb_api_key}&query=${encodeURI(
            movie_result.name
          )}`
        );
        const movie_db = (await reponse.json()).results[0];

        if (movie_db) {
          this.setState({ movie_result: movie_db });
        }
      }
    }
  }

  componentDidMount() {
    try {
      this.load({ search: "" });
    } catch (e) {
      console.error(`KnowledgeGraph didMount:`, e)
      // Google knowledge graph not reachable
    }
  }

  componentDidUpdate(prevProps: { search: string }) {
    try {
      if (prevProps.search !== this.props.search) {
        if (this.state.result != null) {
          this.setState({ result: null, movie_result: null });
        }
        this.load({ search: prevProps.search });
      }
    } catch (e) {
      console.error(`KnowledgeGraph didUpdate:`, e)
      // Google knowledge graph not reachable
    }
  }

  render() {
    const { search } = this.props;
    const { result, movie_result } = this.state;

    const items = result && result.itemListElement;
    const item_result = items && items[0];

    const MINIMAL_RESULT_SCORE = movie_result ? 0 : 100;
    // const MINIMAL_RESULT_SCORE = 50;

    if (!item_result || item_result.resultScore < MINIMAL_RESULT_SCORE) {
      return null;
    } else {
      const item = item_result.result;
      const is_movie = item["@type"].includes("Movie");
      return (
        <Flex column>
          <Flex
            row
            style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 20 }}
          >
            {!is_movie && item.image && (
              <div
                style={{
                  minWidth: 60,
                  height: 60,
                  borderRadius: 30,
                  marginTop: 5,
                  backgroundImage: `url("${item.image.contentUrl}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              />
            )}

            {is_movie && (
              <div
                style={{
                  minWidth: 150,
                  height: 220,
                  backgroundRepeat: `no-repeat`,
                  backgroundSize: "contain",
                  backgroundPosition: "center",
                  backgroundImage:
                    movie_result &&
                    movie_result.poster_path &&
                    `url("http://image.tmdb.org/t/p/w185${movie_result.poster_path}")`,
                  backgroundColor:
                    !(movie_result && movie_result.poster_path) && `#c7c7c7`
                }}
              />
            )}

            <Space width={20} />

            <Flex column style={{ minWidth: 0 }}>
              <Flex style={{ fontSize: 32, flexWrap: "wrap" }}>
                {item.name}
              </Flex>
              <Space height={5} />
              <Flex
                row
                style={{ fontWeight: "100", fontSize: 16, flexWrap: "wrap" }}
              >
                <span>{item.description}</span>
                <Space width={10} />
                <a href={item.url} style={{ color: "#313261" }}>
                  {item.url}
                </a>
              </Flex>

              {item.detailedDescription && (
                <React.Fragment>
                  <Space height={10} />
                  <Flex style={{ fontSize: 16 }}>
                    <span>
                      {item.detailedDescription.articleBody}
                      <a href={item.detailedDescription.url}>
                        {" "}
                        {item.detailedDescription.url.includes("wikipedia")
                          ? "Wikipedia"
                          : item.detailedDescription.url}
                      </a>
                    </span>
                  </Flex>
                </React.Fragment>
              )}
            </Flex>
          </Flex>

          {(items || []).slice(1).map((item, i) => (
            <KnowledgeGraph_Item key={i} item={item.result} />
          ))}
        </Flex>
      );
    }
  }
}

export default KnowledgeGraph;
