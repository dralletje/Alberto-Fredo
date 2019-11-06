// @flow

import React from 'react';
import math from 'mathjs';
import d3 from 'd3';
import functionPlot from 'function-plot';

import 'katex/dist/katex.min.css';
import katex from 'katex';

import { Flex } from './Elements';
import { File_Icon_Image } from './Electron';

const Katex = ({ latex }) => {
  const str = katex.renderToString(latex, {
    throwOnError: false,
  });
  return <div dangerouslySetInnerHTML={{ __html: str }} />
}

class Graph extends React.Component<{ fn: string }> {
  ref: ?HTMLElement;

  componentDidMount() {
    functionPlot({
      target: this.ref,
      data: [{
        fn: this.props.fn,
        sampler: 'builtIn',  // this will make function-plot use the evaluator of math.js
        graphType: 'polyline'
      }]
    });
  }

  render() {
    return <div ref={ref => this.ref = ref} />
  }
}

const try_parsing_as_math = (math_string, force) => {
  const known_symbols = ['pi', 'tau', 'e'];
  try {
    let has_operation = false;
    let has_number = false;
    let is_invalid = false;
    let variables = new Set();

    const parsed = math.parse(math_string);
    parsed.traverse(node => {
      if (node.type === 'OperatorNode' || node.type === 'FunctionNode') {
        // Needs at least one
        has_operation = true;
      }
      if (node.type === 'ConstantNode' && node.valueType === 'number') {
        has_number = true;
      }
      if (node.type === 'ConstantNode' && node.valueType === 'undefined') {
        is_invalid = true;
      }
      if (node.type === 'SymbolNode') {
        if (!known_symbols.includes(node.name)) {
          variables.add(node.name);
        }
      }
    })

    // Because the .transform method doesn't support setting .implicit...
    const mutate_thing = (thing, cb) => {
      if (typeof thing !== 'object') {
        return;
      }
      Object.values(thing).forEach(sub_thing => {
        mutate_thing(sub_thing, cb);
      })
      cb(thing);
      return thing
    }

    const is_symbol_node_for_display = node => {
      return node.type === 'SymbolNode'
        || (node.type === 'OperatorNode' && node.args[0].type === 'SymbolNode');
    }

    const can_be_valid = has_number && has_operation;
    if (!is_invalid && (can_be_valid || force)) {
      const is_abstract = variables.size !== 0;
      const is_graph = variables.size === 1 && variables.has('x');
      const result = {
        tree: parsed,
        result: !is_abstract && parsed.eval({
          e: Math.E,
        }).toString(),
        simplified: is_abstract && mutate_thing(math.simplify(parsed), node => {
          if (!node) return;
          if (node.type === 'OperatorNode' && node.fn === 'multiply') {
            // $FlowFixMe things
            const [arg1, arg2] = node.args;
            if (is_symbol_node_for_display(arg1.type) && arg2.type === 'ConstantNode') {
              // Mutation :O (Reverse the arguments eg x*4 => 4x);
              node.args = [arg2, arg1];
            }
            if (arg1.type === 'ConstantNode' && is_symbol_node_for_display(arg2)) {
              node.implicit = true;
            }
            if (is_symbol_node_for_display(arg1) && is_symbol_node_for_display(arg2)) {
              node.implicit = true;
            }
          }
          return node;
        }),
        is_abstract: is_abstract,
        is_graph: is_graph,
      };
      return result;
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

class MathResult extends React.PureComponent<{ text: string, onTextChange: (text: string) => mixed }> {
  render() {
    const { text, onTextChange } = this.props;

    const math_result =
      text.startsWith('=')
      ? try_parsing_as_math(text.slice(1), true)
      : try_parsing_as_math(text, false)

    if (math_result == null) {
      return null;
    } else {
      return (
        <Flex column style={{ paddingLeft: 10, paddingRight: 10 }}>
          <Flex row style={{ alignItems: 'center' }}>
            <File_Icon_Image
              icon={{ type: 'file', path: '/Applications/Calculator.app' }}
              style={{
                margin: 10,
                height: 60,
                minWidth: 60,
              }}
            />

            <Flex column style={{ marginBottom: 10 }}>
              <Flex style={{ fontSize: 16 }}><Katex latex={math_result.tree.toTex()} /></Flex>

              { !math_result.is_abstract &&
                <Flex row style={{ fontSize: 30, alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1em', marginRight: 10 }}>= </span>
                  {math_result.result}
                </Flex>
              }
              { math_result.is_abstract &&
                <Flex row style={{ fontSize: 30, alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1em', marginRight: 10 }}>= </span>
                  <Katex latex={math_result.simplified.toTex()} />
                </Flex>
              }
            </Flex>
          </Flex>

          { math_result.is_graph &&
            <Graph
              fn={math_result.simplified.toString()}
            />
          }
        </Flex>
      )
    }
  }
}

export default MathResult;
