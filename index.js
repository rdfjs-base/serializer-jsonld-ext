const SerializerStream = require('./lib/SerializerStream')
const Sink = require('@rdfjs/sink')

class Serializer extends Sink {
  constructor (options) {
    super(SerializerStream, options)
  }
}

module.exports = Serializer
