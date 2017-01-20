import React from 'react';
import { connect } from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';
import Authentication from '../../../js/app/containers/authentication';

describe('This test concern app container', () => {
  it('Should test React renderer', () => {
    const renderer = ReactTestRenderer.create(
      <Authentication />
    );
    const result = renderer.toJSON();
    const expectedResult = {"children": [{"children": ["Panel Title"], "props": {}, "type": "span"}], "props": {}, "type": "p"};
    expect(result).toEqual(expectedResult);
  });
});