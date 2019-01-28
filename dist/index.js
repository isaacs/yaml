"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _parse = _interopRequireDefault(require("./cst/parse"));

var _Document = _interopRequireDefault(require("./Document"));

var _errors = require("./errors");

var _schema = _interopRequireDefault(require("./schema"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* global console */
const defaultOptions = {
  anchorPrefix: 'a',
  keepCstNodes: false,
  keepNodeTypes: true,
  keepBlobsInJSON: true,
  mapAsMap: false,
  tags: null,
  version: '1.2'
};

function createNode(value, wrapScalars = true, tag) {
  if (tag === undefined && typeof wrapScalars === 'string') {
    tag = wrapScalars;
    wrapScalars = true;
  }

  const options = Object.assign({}, _Document.default.defaults[defaultOptions.version], defaultOptions);
  const schema = new _schema.default(options);
  return schema.createNode(value, wrapScalars, tag);
}

class Document extends _Document.default {
  constructor(options) {
    super(Object.assign({}, defaultOptions, options));
  }

}

function parseAllDocuments(src, options) {
  return (0, _parse.default)(src).map(cstDoc => new Document(options).parse(cstDoc));
}

function parseDocument(src, options) {
  const cst = (0, _parse.default)(src);
  const doc = new Document(options).parse(cst[0]);

  if (cst.length > 1) {
    const errMsg = 'Source contains multiple documents; please use YAML.parseAllDocuments()';
    doc.errors.unshift(new _errors.YAMLSemanticError(cst[1], errMsg));
  }

  return doc;
}

function parse(src, options) {
  const doc = parseDocument(src, options); // eslint-disable-next-line no-console

  doc.warnings.forEach(warning => console.warn(warning));
  if (doc.errors.length > 0) throw doc.errors[0];
  return doc.toJSON();
}

function stringify(value, options) {
  const doc = new Document(options);
  doc.contents = value;
  return String(doc);
}

var _default = {
  createNode,
  defaultOptions,
  Document,
  parse,
  parseAllDocuments,
  parseCST: _parse.default,
  parseDocument,
  stringify
};
exports.default = _default;
module.exports = exports.default;
module.exports.default = exports.default;