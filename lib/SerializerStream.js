const jsonld = require('jsonld')
const Readable = require('readable-stream')
const SerializerStream = require('rdf-serializer-jsonld/lib/SerializerStream')

class SerializerStreamExt extends Readable {
  constructor (input, options) {
    super({
      objectMode: true
    })

    this.options = options || {}
    this.options.context = this.options.context || {}

    this.stream = new SerializerStream(input, this.options)

    input.on('prefix', (prefix, namespace) => {
      this.handlePrefix(prefix, namespace)
    })

    this.stream.on('data', (data) => {
      this.handleData(data)
    })

    this.stream.on('error', (err) => {
      this.emit('error', err)
    })
  }

  _read () {
  }

  handlePrefix (prefix, namespace) {
    if (!(prefix in this.options.context)) {
      this.options.context[prefix] = namespace.value
    }
  }

  handleData (data) {
    Promise.resolve().then(() => {
      if (this.options.compact) {
        return jsonld.promises().compact(data, this.options.context)
      }

      return data
    }).then((data) => {
      return this.options.outputFormat === 'string' ? JSON.stringify(data) : data
    }).then((data) => {
      this.push(data)
      this.push(null)
    }).catch((err) => {
      this.emit('error', err)
    })
  }
}

module.exports = SerializerStreamExt
