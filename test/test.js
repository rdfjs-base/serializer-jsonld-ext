/* global describe, it */

const assert = require('assert')
const rdf = require('rdf-ext')
const sinkTest = require('rdf-sink/test')
const Readable = require('readable-stream')
const JsonLdSerializerExt = require('..')

function quadsToReadable (quads) {
  const readable = new Readable()

  readable._readableState.objectMode = true

  readable._read = () => {
    quads.forEach((quad) => {
      readable.push(quad)
    })

    readable.push(null)
  }

  return readable
}

describe('rdf-serializer-jsonld-ext', () => {
  sinkTest(JsonLdSerializerExt, {readable: true})

  it('should support string output', () => {
    const quad = rdf.quad(
      rdf.namedNode('http://example.org/subject'),
      rdf.namedNode('http://example.org/predicate'),
      rdf.literal('object1'))

    const jsonldString = JSON.stringify([{
      '@id': 'http://example.org/subject',
      'http://example.org/predicate': 'object1'
    }])

    const input = quadsToReadable([quad])
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
      '@id': 'ex:subject',
      'ex:predicate': 'object1'
    }

    const input = quadsToReadable([quad])
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
        '@type': 'Thing',
        property0: {
          '@type': 'OtherThing',
          property1: 'value1'
        }
      }]
    }

    const input = quadsToReadable(quads)
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

  it('should skip @graph property if skipGraphProperty is true and array.length == 1', () => {
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
      '@type': 'Thing',
      property0: {
        '@type': 'OtherThing',
        property1: 'value1'
      }
    }

    const input = quadsToReadable(quads)
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

  it('should not skip @graph property if skipGraphProperty is true and array.length != 1', () => {
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
        '@type': 'Thing',
        'property0': 'value0'
      }, {
        '@type': 'OtherThing',
        'property1': 'value1'
      }]
    }

    const input = quadsToReadable(quads)
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

  it('should remove @context if skipContext is true', () => {
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
      '@type': 'Thing'
    }

    const jsonld = {
      '@graph': [{
        '@type': 'Thing',
        'property0': 'value0'
      }]
    }

    const input = quadsToReadable(quads)
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
      '@id': 'ex:subject',
      'ex:predicate': 'object1'
    }

    const input = quadsToReadable([quad])
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

  it('should support multiple processing steps', () => {
    const s0 = rdf.namedNode('http://example.org/subject')

    const quads = [
      rdf.quad(
        s0,
        rdf.namedNode('http://example.org/property0'),
        rdf.literal('value0')
      ),
      rdf.quad(
        s0,
        rdf.namedNode('http://example.org/property1'),
        rdf.literal('value1')
      )
    ]

    const jsonld = {
      '@id': 'http://example.org/subject',
      'http://example.org/property0': 'value0',
      'http://example.org/property1': 'value1'
    }

    const input = quadsToReadable(quads)
    const serializer = new JsonLdSerializerExt({
      process: [
        {flatten: true},
        {compact: true}
      ]
    })
    const stream = serializer.import(input)

    let result

    stream.on('data', (data) => {
      result = data
    })

    return rdf.waitFor(stream).then(() => {
      assert.deepEqual(result, jsonld)
    })
  })
})
