const SerializerStream = require('./lib/SerializerStream')
const Sink = require('rdf-sink')

class Serializer extends Sink {
  constructor (options) {
    super(SerializerStream, options)
  }
}

module.exports = Serializer
