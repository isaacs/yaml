"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.YAMLWarning = exports.YAMLSyntaxError = exports.YAMLSemanticError = exports.YAMLReferenceError = exports.YAMLError = void 0;

var _Node = _interopRequireDefault(require("./cst/Node"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class YAMLError extends Error {
  constructor(name, source, message) {
    if (!message || !(source instanceof _Node.default)) throw new Error(`Invalid arguments for new ${name}`);
    super();
    this.name = name;
    this.message = message;
    this.source = source;
  }

  makePretty() {
    if (this.source) {
      this.nodeType = this.source.type;
      this.range = this.source.range;
      this.linePos = this.source.rangeAsLinePos;
      delete this.source;
    }
  }

}

exports.YAMLError = YAMLError;

class YAMLReferenceError extends YAMLError {
  constructor(source, message) {
    super('YAMLReferenceError', source, message);
  }

}

exports.YAMLReferenceError = YAMLReferenceError;

class YAMLSemanticError extends YAMLError {
  constructor(source, message) {
    super('YAMLSemanticError', source, message);
  }

}

exports.YAMLSemanticError = YAMLSemanticError;

class YAMLSyntaxError extends YAMLError {
  constructor(source, message) {
    super('YAMLSyntaxError', source, message);
  }

}

exports.YAMLSyntaxError = YAMLSyntaxError;

class YAMLWarning extends YAMLError {
  constructor(source, message) {
    super('YAMLWarning', source, message);
  }

}

exports.YAMLWarning = YAMLWarning;