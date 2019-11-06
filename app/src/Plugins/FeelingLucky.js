import React from 'react';
import {
  Flex,
  Component,
  View,
  Space,
  precondition,
  DelayRepeatedRender,
  TextInput
} from "../Elements";


export class FeelingLucky extends React.Component<{ search: string }> {
  async load() {
    const { search } = this.props;
    const response = await fetch(
      `http://www.google.com/search?&sourceid=navclient&btnI=I&q=${encodeURI(
        search
      )}`,
      {
        method: "get",
        headers: {
          referer: "https://www.google.com/"
        }
      }
    );

    const redirect_url = response.url;

    let redirect_google_url = redirect_url.match(/https:\/\/www\.google\.com\/url\?q=(.*)/);

    if (redirect_url.match(/https?:\/\/(www\.)?google\.[a-z]+\/search/)) {
      return;
    }

    const text = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    const meta_tags = Array.from(doc.querySelectorAll("meta"));
    const title_tag = doc.querySelector("title");
    const link_tags = Array.from(doc.querySelectorAll("link"));

    const valid_meta = [
      {
        source: "name",
        value: "description",
        type: "description"
      },
      {
        source: "property",
        value: "og:description",
        type: "description"
      },
      {
        source: "name",
        value: "keywords",
        type: "keywords"
      },
      {
        source: "property",
        value: "og:image",
        type: "image"
      },
      {
        source: "property",
        value: "og:url",
        type: "url"
      },
      {
        source: "property",
        value: "og:type",
        type: "type"
      },
      {
        source: "property",
        value: "og:site_name",
        type: "site-name"
      },
      {
        source: "name",
        value: "title",
        type: "title"
      }
    ];
    const info = meta_tags
      .map(tag => {
        return {
          name: tag.name,
          itemprop: tag.getAttribute("itemprop"),
          property: tag.getAttribute("property"),
          content: tag.getAttribute("content"),
          tag: tag
        };
      })
      .filter(x => x.name || x.itemprop || x.property);
    const title = title_tag && title_tag.innerHTML;

    const valid_rel = [
      "icon",
      "shortcut icon",
      "apple-touch-icon",
      "search",
      "image_src"
    ];
    const link_info = link_tags.filter(x =>
      valid_rel.includes(x.getAttribute("rel"))
    );

    console.log(`title_tag:`, title_tag)
    console.log(`info:`, info)
    console.log(`link_info:`, link_info)

    // console.log(`link_info:`, link_info)
    // console.log(`info:`, info)
    // console.log(`title:`, title)
  }

  async componentDidMount() {
    this.load();
  }

  async componentDidUpdate() {
    this.load();
  }

  render() {
    return <Flex></Flex>;
  }
}
