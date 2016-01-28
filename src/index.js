/*!
 * React Native Autolink
 *
 * Copyright 2016 Josh Swan
 * Released under the MIT license
 * https://github.com/joshswan/react-native-autolink/blob/master/LICENSE
 */
'use strict';

import React, {Component, PropTypes, createElement} from 'react-native';
import Autolinker from 'autolinker';

const {
  LinkingIOS,
  StyleSheet,
  Text,
} = React;

export default class Autolink extends Component {
  getURL(match) {
    let type = match.getType();

    switch (type) {
      case 'email':
        return 'mailto://' + encodeURIComponent(match.getEmail());
      case 'hashtag':
        let tag = encodeURIComponent(match.getHashtag());

        switch (this.props.hashtag) {
          case 'facebook':
            return 'facebook://hashtag/' + tag;
          case 'instagram':
            return 'instagram://tag?name=' + tag;
          case 'twitter':
            return 'twitter://search?query=%23' + tag;
          default:
            return match.getMatchedText();
        }
        break;
      case 'phone':
        return 'tel://' + match.getNumber();
      case 'twitter':
        return 'twitter://user?screen_name=' + encodeURIComponent(match.getTwitterHandle());
      case 'url':
        return match.getAnchorHref();
      default:
        return match.getMatchedText();
    }
  }

  _onPress(url, match) {
    if (this.props.onPress) {
      this.props.onPress(url, match);
    } else {
      LinkingIOS.openURL(url);
    }
  }

  renderLink(text, url, match) {
    let truncated = (this.props.truncate > 0) ? Autolinker.truncate.TruncateSmart(text, this.props.truncate, this.props.truncateChars) : text;

    return (
      <Text
        style={[styles.link, this.props.linkStyle]}
        onPress={this._onPress.bind(this, url, match)}>
          {truncated}
      </Text>
    );
  }

  render() {
    let text = this.props.text || '';

    // Creates a token with a random UID that should not be guessable or
    // conflict with other parts of the string.
    let uid = Math.floor(Math.random() * 0x10000000000).toString(16);
    let tokenRegexp = new RegExp(`(@__ELEMENT-${uid}-\\d+__@)`, 'g');

    let generateToken = (() => {
      let counter = 0;
      return () => `@__ELEMENT-${uid}-${counter += 1}__@`;
    })();

    let matches = {};

    try {
      text = Autolinker.link(text, {
        email: this.props.email,
        hashtag: this.props.hashtag,
        phone: this.props.phone,
        twitter: this.props.twitter,
        urls: this.props.url,
        stripPrefix: this.props.stripPrefix,
        replaceFn: (autolinker, match) => {
          let token = generateToken();

          matches[token] = match;

          return token;
        },
      });
    } catch (e) {
      console.warn(e);

      return null;
    }

    let nodes = text
      .split(tokenRegexp)
      .filter((part) => !!part)
      .map((part) => {
        let match = matches[part];

        if (!match) return part;

        switch (match.getType()) {
          case 'email':
          case 'hashtag':
          case 'phone':
          case 'twitter':
          case 'url':
            return (this.props.renderLink) ? this.props.renderLink(match.getAnchorText(), this.getURL(match), match) : this.renderLink(match.getAnchorText(), this.getURL(match), match);
          default:
            return part;
        }
      });

    return createElement(Text, {ref: (component) => { this._root = component; }, style: this.props.style}, ...nodes);
  }
}

const styles = StyleSheet.create({
  link: {
    color: '#3b78a3',
  },
});

Autolink.defaultProps = {
  email: true,
  hashtag: false,
  phone: true,
  stripPrefix: true,
  truncate: 32,
  truncateChars: '..',
  twitter: false,
  url: true,
};

Autolink.propTypes = {
  email: PropTypes.bool,
  hashtag: PropTypes.oneOf([false, 'facebook', 'instagram', 'twitter']),
  linkStyle: Text.propTypes.style,
  onPress: PropTypes.func,
  phone: PropTypes.bool,
  renderLink: PropTypes.func,
  stripPrefix: PropTypes.bool,
  style: Text.propTypes.style,
  text: PropTypes.string.isRequired,
  truncate: PropTypes.number,
  truncateChars: PropTypes.string,
  twitter: PropTypes.bool,
  url: PropTypes.bool,
};
