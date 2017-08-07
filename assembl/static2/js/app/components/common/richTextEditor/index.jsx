import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Editor } from 'draft-js';
import punycode from 'punycode';

import Toolbar from './toolbar';

export default class RichTextEditor extends React.PureComponent {
  constructor() {
    super();
    this.focusEditor = this.focusEditor.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  onChange(newEditorState) {
    const { updateEditorState } = this.props;
    updateEditorState(newEditorState);
  }

  getToolbarButtons() {
    const bold = {
      id: 'bold',
      icon: 'text-bold',
      type: 'style',
      style: 'BOLD'
    };
    const italic = {
      id: 'italic',
      icon: 'text-italics',
      type: 'style',
      style: 'ITALIC'
    };
    const bullets = {
      id: 'bullets',
      icon: 'text-bullets',
      type: 'block-type',
      style: 'unordered-list-item'
    };
    const buttons = [bold, italic, bullets];
    return buttons;
  }

  getCharCount(editorState) {
    // this code is "borrowed" from the draft-js counter plugin
    const decodeUnicode = (str) => {
      return punycode.ucs2.decode(str);
    }; // func to handle unicode characters
    const plainText = editorState.getCurrentContent().getPlainText('');
    const regex = /(?:\r\n|\r|\n)/g; // new line, carriage return, line feed
    const cleanString = plainText.replace(regex, '').trim(); // replace above characters w/ nothing
    return decodeUnicode(cleanString).length;
  }

  focusEditor() {
    setTimeout(() => {
      return this.editor.focus();
    }, 50);
  }

  render() {
    const { editorState, maxLength, placeholder } = this.props;
    const charCount = this.getCharCount(editorState);
    const remainingChars = maxLength - charCount;
    return (
      <div className="rich-text-editor">
        <Toolbar
          buttonsConfig={this.getToolbarButtons()}
          editorState={editorState}
          focusEditor={this.focusEditor}
          onChange={this.onChange}
        />
        <Editor
          editorState={editorState}
          onChange={this.onChange}
          placeholder={placeholder}
          ref={(e) => {
            return (this.editor = e);
          }}
        />
        <div className="annotation margin-xs">
          <Translate value="debate.remaining_x_characters" nbCharacters={remainingChars < 10000 ? remainingChars : maxLength} />
        </div>
      </div>
    );
  }
}