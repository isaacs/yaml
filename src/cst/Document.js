import { Char, Type } from '../constants'
import { YAMLSemanticError, YAMLSyntaxError } from '../errors'
import BlankLine from './BlankLine'
import { grabCollectionEndComments } from './Collection'
import Comment from './Comment'
import Directive from './Directive'
import Node from './Node'
import Range from './Range'

export default class Document extends Node {
  static startCommentOrEndBlankLine(src, start) {
    const offset = Node.endOfWhiteSpace(src, start)
    const ch = src[offset]
    return ch === '#' || ch === '\n' ? offset : start
  }

  constructor() {
    super(Type.DOCUMENT)
    this.directives = null
    this.contents = null
    this.directivesEndMarker = null
    this.documentEndMarker = null
  }

  parseDirectives(start) {
    const { src } = this.context
    this.directives = []
    let atLineStart = true
    let hasDirectives = false
    let offset = start
    while (!Node.atDocumentBoundary(src, offset, Char.DIRECTIVES_END)) {
      offset = Document.startCommentOrEndBlankLine(src, offset)
      switch (src[offset]) {
        case '\n':
          if (atLineStart) {
            const blankLine = new BlankLine()
            offset = blankLine.parse({ src }, offset)
            if (offset < src.length) {
              this.directives.push(blankLine)
              trace: 'directive-blankline', blankLine.range
            }
          } else {
            offset += 1
            atLineStart = true
          }
          break
        case '#':
          {
            const comment = new Comment()
            offset = comment.parse({ src }, offset)
            this.directives.push(comment)
            atLineStart = false
            trace: 'directive-comment', comment.comment
          }
          break
        case '%':
          {
            const directive = new Directive()
            offset = directive.parse({ parent: this, src }, offset)
            this.directives.push(directive)
            hasDirectives = true
            atLineStart = false
            trace: 'directive',
              { valueRange: directive.valueRange, comment: directive.comment },
              JSON.stringify(directive.rawValue)
          }
          break
        default:
          if (hasDirectives) {
            this.error = new YAMLSemanticError(
              this,
              'Missing directives-end indicator line'
            )
          } else if (this.directives.length > 0) {
            this.contents = this.directives
            this.directives = []
          }
          return offset
      }
    }
    if (src[offset]) {
      this.directivesEndMarker = new Range(offset, offset + 3)
      return offset + 3
    }
    if (hasDirectives) {
      this.error = new YAMLSemanticError(
        this,
        'Missing directives-end indicator line'
      )
    } else if (this.directives.length > 0) {
      this.contents = this.directives
      this.directives = []
    }
    return offset
  }

  parseContents(start) {
    const { parseNode, src } = this.context
    if (!this.contents) this.contents = []
    let lineStart = start
    while (src[lineStart - 1] === '-') lineStart -= 1
    let offset = Node.endOfWhiteSpace(src, start)
    let atLineStart = lineStart === start
    this.valueRange = new Range(offset)
    while (!Node.atDocumentBoundary(src, offset, Char.DOCUMENT_END)) {
      switch (src[offset]) {
        case '\n':
          if (atLineStart) {
            const blankLine = new BlankLine()
            offset = blankLine.parse({ src }, offset)
            if (offset < src.length) {
              this.contents.push(blankLine)
              trace: 'content-blankline', blankLine.range
            }
          } else {
            offset += 1
            atLineStart = true
          }
          lineStart = offset
          break
        case '#':
          {
            const comment = new Comment()
            offset = comment.parse({ src }, offset)
            this.contents.push(comment)
            trace: 'content-comment', comment.comment
            atLineStart = false
          }
          break
        default: {
          const iEnd = Node.endOfIndent(src, offset)
          const context = {
            atLineStart,
            indent: -1,
            inFlow: false,
            inCollection: false,
            lineStart,
            parent: this
          }
          const node = parseNode(context, iEnd)
          if (!node) return (this.valueRange.end = iEnd) // at next document start
          this.contents.push(node)
          offset = node.range.end
          atLineStart = false
          const ec = grabCollectionEndComments(node)
          if (ec) Array.prototype.push.apply(this.contents, ec)
          trace: 'content-node',
            { valueRange: node.valueRange, comment: node.comment },
            JSON.stringify(node.rawValue)
        }
      }
      offset = Document.startCommentOrEndBlankLine(src, offset)
    }
    this.valueRange.end = offset
    if (src[offset]) {
      this.documentEndMarker = new Range(offset, offset + 3)
      offset += 3
      if (src[offset]) {
        offset = Node.endOfWhiteSpace(src, offset)
        if (src[offset] === '#') {
          const comment = new Comment()
          offset = comment.parse({ src }, offset)
          this.contents.push(comment)
          trace: 'document-suffix-comment', comment.comment
        }
        switch (src[offset]) {
          case '\n':
            offset += 1
            break
          case undefined:
            break
          default:
            this.error = new YAMLSyntaxError(
              this,
              'Document end marker line cannot have a non-comment suffix'
            )
        }
      }
    }
    return offset
  }

  /**
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this
   */
  parse(context, start) {
    context.root = this
    this.context = context
    const { src } = context
    trace: 'DOC START', JSON.stringify(src.slice(start))
    let offset = src.charCodeAt(start) === 0xfeff ? start + 1 : start // skip BOM
    offset = this.parseDirectives(offset)
    offset = this.parseContents(offset)
    trace: 'DOC', this.contents
    return offset
  }

  setOrigRanges(cr, offset) {
    offset = super.setOrigRanges(cr, offset)
    this.directives.forEach(node => {
      offset = node.setOrigRanges(cr, offset)
    })
    if (this.directivesEndMarker)
      offset = this.directivesEndMarker.setOrigRange(cr, offset)
    this.contents.forEach(node => {
      offset = node.setOrigRanges(cr, offset)
    })
    if (this.documentEndMarker)
      offset = this.documentEndMarker.setOrigRange(cr, offset)
    return offset
  }

  toString() {
    const { contents, directives, value } = this
    if (value != null) return value
    let str = directives.join('')
    if (contents.length > 0) {
      if (directives.length > 0 || contents[0].type === Type.COMMENT)
        str += '---\n'
      str += contents.join('')
    }
    if (str[str.length - 1] !== '\n') str += '\n'
    return str
  }
}
