/* global describe, it */

const assert = require('assert')
const rdf = require('rdf-ext')
const sinkTest = require('rdf-sink/test')
const Readable = require('readable-stream')
const JsonLdSerializerExt = require('..')

describe('rdf-serializer-jsonld-ext', () => {
  sinkTest(JsonLdSerializerExt, {readable: true})

  it('should support string output', () => {
    const quad = rdf.quad(
      rdf.namedNode('http://example.org/subject'),
      rdf.namedNode('http://example.org/predicate'),
      rdf.literal('object1'))

    const jsonldString = JSON.stringify([{
      '@id': '@default',
      '@graph': {
        '@id': 'http://example.org/subject',
        'http://example.org/predicate': 'object1'
      }
    }])

    const input = new Readable()

    input._readableState.objectMode = true

    input._read = () => {
      input.push(quad)
      input.push(null)
    }

    const serializer = new JsonLdSerializerExt({outputFormat: 'string'})
    const stream = serializer.import(input)

    let result

    stream.on('data', (data) => {
      result = data
    })

    return rdf.waitFor(stream).then(() => {
      assert.equal(result, jsonldString)
    })
  })

  it('should support compact', () => {
    const quad = rdf.quad(
      rdf.namedNode('http://example.org/subject'),
      rdf.namedNode('http://example.org/predicate'),
      rdf.literal('object1'))

    const context = {
      'ex': 'http://example.org/'
    }

    const jsonld = {
      '@context': context,
      '@id': '@default',
      '@graph': [{
        '@id': 'ex:subject',
        'ex:predicate': 'object1'
      }]
    }

    const input = new Readable()

    input._readableState.objectMode = true

    input._read = () => {
      input.push(quad)
      input.push(null)
    }

    const serializer = new JsonLdSerializerExt({compact: true, context: context})
    const stream = serializer.import(input)

    let result

    stream.on('data', (data) => {
      result = data
    })

    return rdf.waitFor(stream).then(() => {
      assert.deepEqual(result, jsonld)
    })
  })

  it('should support frame', () => {
    const root = rdf.blankNode()
    const property = rdf.blankNode()

    const quads = [
      rdf.quad(
        root,
        rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        rdf.namedNode('http://example.org/Thing')
      ),
      rdf.quad(
        root,
        rdf.namedNode('http://example.org/property0'),
        property
      ),
      rdf.quad(
        property,
        rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        rdf.namedNode('http://example.org/OtherThing')
      ),
      rdf.quad(
        property,
        rdf.namedNode('http://example.org/property1'),
        rdf.literal('value1')
      )
    ]

    const context = {
      '@context': {
        '@vocab': 'http://example.org/'
      },
      '@type': 'Thing'
    }

    const jsonld = {
      '@context': {
        '@vocab': 'http://example.org/'
      },
      '@graph': [{
        '@id': '_:b0',
        '@type': 'Thing',
        property0: {
          '@id': '_:b1',
          '@type': 'OtherThing',
          property1: 'value1'
        }
      }]
    }

    const input = new Readable()

    input._readableState.objectMode = true

    input._read = () => {
      quads.forEach((quad) => {
        input.push(quad)
      })

      input.push(null)
    }

    const serializer = new JsonLdSerializerExt({frame: true, context: context})
    const stream = serializer.import(input)

    let result

    stream.on('data', (data) => {
      result = data
    })

    return rdf.waitFor(stream).then(() => {
      assert.deepEqual(result, jsonld)
    })
  })

  it('should skip @graph property if options is true and array.length == 1', () => {
    const root = rdf.blankNode()
    const property = rdf.blankNode()

    const quads = [
      rdf.quad(
        root,
        rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        rdf.namedNode('http://example.org/Thing')
      ),
      rdf.quad(
        root,
        rdf.namedNode('http://example.org/property0'),
        property
      ),
      rdf.quad(
        property,
        rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        rdf.namedNode('http://example.org/OtherThing')
      ),
      rdf.quad(
        property,
        rdf.namedNode('http://example.org/property1'),
        rdf.literal('value1')
      )
    ]

    const context = {
      '@context': {
        '@vocab': 'http://example.org/'
      },
      '@type': 'Thing'
    }

    const jsonld = {
      '@context': {
        '@vocab': 'http://example.org/'
      },
      '@id': '_:b0',
      '@type': 'Thing',
      property0: {
        '@id': '_:b1',
        '@type': 'OtherThing',
        property1: 'value1'
      }
    }

    const input = new Readable()

    input._readableState.objectMode = true

    input._read = () => {
      quads.forEach((quad) => {
        input.push(quad)
      })

      input.push(null)
    }

    const serializer = new JsonLdSerializerExt({frame: true, context: context, skipGraphProperty: true})
    const stream = serializer.import(input)

    let result

    stream.on('data', (data) => {
      result = data
    })

    return rdf.waitFor(stream).then(() => {
      assert.deepEqual(result, jsonld)
    })
  })

  it('should not skip @graph property if options is true and array.length != 1', () => {
    const s0 = rdf.blankNode('b0')
    const s1 = rdf.blankNode('b1')

    const quads = [
      rdf.quad(
        s0,
        rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        rdf.namedNode('http://example.org/Thing')
      ),
      rdf.quad(
        s0,
        rdf.namedNode('http://example.org/property0'),
        rdf.literal('value0')
      ),
      rdf.quad(
        s1,
        rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        rdf.namedNode('http://example.org/OtherThing')
      ),
      rdf.quad(
        s1,
        rdf.namedNode('http://example.org/property1'),
        rdf.literal('value1')
      )
    ]

    const context = {
      '@context': {
        '@vocab': 'http://example.org/'
      }
    }

    const jsonld = {
      '@context': {
        '@vocab': 'http://example.org/'
      },
      '@graph': [{
        '@id': '@default'
      }, {
        '@id': '_:b0',
        '@type': 'Thing',
        'property0': 'value0'
      }, {
        '@id': '_:b1',
        '@type': 'OtherThing',
        'property1': 'value1'
      }]
    }

    const input = new Readable()

    input._readableState.objectMode = true

    input._read = () => {
      quads.forEach((quad) => {
        input.push(quad)
      })

      input.push(null)
    }

    const serializer = new JsonLdSerializerExt({frame: true, context: context, skipGraphProperty: true})
    const stream = serializer.import(input)

    let result

    stream.on('data', (data) => {
      result = data
    })

    return rdf.waitFor(stream).then(() => {
      assert.deepEqual(result, jsonld)
    })
  })


  it('should not skip @graph property if options is true and array.length != 1', () => {
    const s0 = rdf.blankNode('b0')

    const quads = [
      rdf.quad(
        s0,
        rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        rdf.namedNode('http://example.org/Thing')
      ),
      rdf.quad(
        s0,
        rdf.namedNode('http://example.org/property0'),
        rdf.literal('value0')
      )
    ]

    const context = {
      '@context': {
        '@vocab': 'http://example.org/'
      },
      "@type": "Thing"
    }

    const jsonld = {
      '@graph': [{
        '@id': '_:b0',
        '@type': 'Thing',
        'property0': 'value0'
      }]
    }

    const input = new Readable()

    input._readableState.objectMode = true

    input._read = () => {
      quads.forEach((quad) => {
        input.push(quad)
      })

      input.push(null)
    }

    const serializer = new JsonLdSerializerExt({frame: true, context: context, skipContext: true})
    const stream = serializer.import(input)

    let result

    stream.on('data', (data) => {
      result = data
    })

    return rdf.waitFor(stream).then(() => {
      assert.deepEqual(result, jsonld)
    })
  })

  it('should support prefixes', () => {
    const quad = rdf.quad(
      rdf.namedNode('http://example.org/subject'),
      rdf.namedNode('http://example.org/predicate'),
      rdf.literal('object1'))

    const context = {
      'ex': 'http://example.org/'
    }

    const jsonld = {
      '@context': context,
      '@id': '@default',
      '@graph': [{
        '@id': 'ex:subject',
        'ex:predicate': 'object1'
      }]
    }

    const input = new Readable()

    input._readableState.objectMode = true

    input._read = () => {
      input.push(quad)
      input.push(null)
    }

    const serializer = new JsonLdSerializerExt({compact: true})
    const stream = serializer.import(input)

    input.emit('prefix', 'ex', rdf.namedNode('http://example.org/'))

    let result

    stream.on('data', (data) => {
      result = data
    })

    return rdf.waitFor(stream).then(() => {
      assert.deepEqual(result, jsonld)
    })
  })
})
