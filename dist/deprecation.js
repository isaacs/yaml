"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.warnFileDeprecation = warnFileDeprecation;
exports.warnOptionDeprecation = warnOptionDeprecation;

/* global global, console */
function warn(msg) {
  if (global && global.process && global.process.emitWarning) {
    global.process.emitWarning(msg, 'DeprecationWarning');
  } else {
    // eslint-disable-next-line no-console
    console.warn(`DeprecationWarning: ${msg}`);
  }
}

function warnFileDeprecation(filename) {
  if (global && global._YAML_SILENCE_DEPRECATION_WARNINGS) return;
  const path = filename.replace(/.*yaml[/\\]/i, '').replace(/\.js$/, '').replace(/\\/g, '/');
  warn(`The endpoint 'yaml/${path}' will be removed in a future release.`);
}

const warned = {};

function warnOptionDeprecation(name, alternative) {
  if (global && global._YAML_SILENCE_DEPRECATION_WARNINGS) return;
  if (warned[name]) return;
  warned[name] = true;
  let msg = `The option '${name}' will be removed in a future release`;
  msg += alternative ? `, use '${alternative}' instead.` : '.';
  warn(msg);
}