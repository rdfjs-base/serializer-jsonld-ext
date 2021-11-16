const jsonld = require('jsonld')
const { Readable } = require('readable-stream')
const streamConcat = require('./streamConcat')

class SerializerStream extends Readable {
  constructor (input, {
    context = {},
    compact,
    flatten,
    frame,
    skipContext,
    encoding = 'object'
  } = {}) {
    super({
      objectMode: true,
      read: () => {}
    })

    this.context = context
    this.compact = compact
    this.flatten = flatten
    this.frame = frame
    this.skipContext = skipContext
    this.encoding = encoding

    input.on('prefix', (prefix, namespace) => {
      if (!this.context[prefix]) {
        this.context[prefix] = namespace.value
      }
    })

    this.handleData(input)
  }

  async handleData (input) {
    try {
      const quadArray = (await streamConcat(input)).map(SerializerStream.toJsonldQuad)
      const rawJsonld = await jsonld.fromRDF(quadArray)
      const transformedJsonld = await this.transform(rawJsonld, this.options)

      this.push(transformedJsonld)
      this.push(null)
    } catch (err) {
      this.emit('error', err)
    }
  }

  async transform (data) {
    if (this.compact) {
      data = await jsonld.compact(data, this.context)
    }

    if (this.flatten) {
      data = await jsonld.flatten(data, this.context)
    }

    if (this.frame) {
      data = await jsonld.frame(data, this.context)
    }

    if (this.skipContext && data['@context']) {
      delete data['@context']
    }

    if (this.encoding === 'string') {
      return JSON.stringify(data)
    }

    return data
  }

  static toJsonldQuad (quad) {
    return {
      subject: SerializerStream.toJsonldTerm(quad.subject),
      predicate: SerializerStream.toJsonldTerm(quad.predicate),
      object: SerializerStream.toJsonldTerm(quad.object),
      graph: SerializerStream.toJsonldTerm(quad.graph)
    }
  }

  static toJsonldTerm (term) {
    if (term.termType === 'BlankNode') {
      return {
        termType: 'BlankNode',
        value: `_:${term.value}`
      }
    }

    return term
  }
}

module.exports = SerializerStream
