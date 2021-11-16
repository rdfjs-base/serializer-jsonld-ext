const Sink = require('@rdfjs/sink')
const SerializerStream = require('./lib/SerializerStream')

class Serializer extends Sink {
  constructor (options) {
    super(SerializerStream, options)
  }
}

module.exports = Serializer
