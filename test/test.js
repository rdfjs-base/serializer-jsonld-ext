/* global describe, it */

const assert = require('assert')
const namespace = require('@rdfjs/namespace')
const quadsToReadable = require('./support/quadsToReadable')
const rdf = require('@rdfjs/data-model')
const sinkTest = require('@rdfjs/sink/test')
const streamConcat = require('../lib/streamConcat')
const JsonldSerializer = require('..')

const ns = {
  ex: namespace('http://example.org/'),
  rdf: namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
}

describe('@rdfjs/serializer-jsonld-ext', () => {
  sinkTest(JsonldSerializer, { readable: true })

  it('should support string output', async () => {
    const quad = rdf.quad(ns.ex.subject, ns.ex.predicate, rdf.literal('object1'))

    const jsonldString = JSON.stringify([{
      '@id': 'http://example.org/subject',
      'http://example.org/predicate': [{
        '@value': 'object1'
      }]
    }])

    const input = quadsToReadable([quad])
    const serializer = new JsonldSerializer({ encoding: 'string' })
    const stream = serializer.import(input)
    const result = (await streamConcat(stream))

    assert.strictEqual(result, jsonldString)
  })

  it('should support compact', async () => {
    const quad = rdf.quad(ns.ex.subject, ns.ex.predicate, rdf.literal('object1'))
    const context = { ex: 'http://example.org/' }

    const jsonld = {
      '@context': context,
      '@id': 'ex:subject',
      'ex:predicate': 'object1'
    }

    const input = quadsToReadable([quad])
    const serializer = new JsonldSerializer({ compact: true, context })
    const stream = serializer.import(input)
    const result = (await streamConcat(stream))[0]

    assert.deepStrictEqual(result, jsonld)
  })

  it('should support frame', async () => {
    const root = rdf.blankNode()
    const property = rdf.blankNode()
    const quads = [
      rdf.quad(root, ns.rdf.type, ns.ex.Thing),
      rdf.quad(root, ns.ex.property0, property),
      rdf.quad(property, ns.rdf.type, ns.ex.OtherThing),
      rdf.quad(property, ns.ex.property1, rdf.literal('value1'))
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
    const serializer = new JsonldSerializer({ frame: true, context })
    const stream = serializer.import(input)
    const result = (await streamConcat(stream))[0]

    assert.deepStrictEqual(result, jsonld)
  })

  it('should skip @graph property if skipGraphProperty is true and array.length == 1', async () => {
    const root = rdf.blankNode()
    const property = rdf.blankNode()
    const quads = [
      rdf.quad(root, ns.rdf.type, ns.ex.Thing),
      rdf.quad(root, ns.ex.property0, property),
      rdf.quad(property, ns.rdf.type, ns.ex.OtherThing),
      rdf.quad(property, ns.ex.property1, rdf.literal('value1'))
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
    const serializer = new JsonldSerializer({ frame: true, context, skipGraphProperty: true })
    const stream = serializer.import(input)
    const result = (await streamConcat(stream))[0]

    assert.deepStrictEqual(result, jsonld)
  })

  it('should not skip @graph property if skipGraphProperty is true and array.length != 1', async () => {
    const subject0 = rdf.blankNode()
    const subject1 = rdf.blankNode()
    const quads = [
      rdf.quad(subject0, ns.rdf.type, ns.ex.Thing),
      rdf.quad(subject0, ns.ex.property0, rdf.literal('value0')),
      rdf.quad(subject1, ns.rdf.type, ns.ex.OtherThing),
      rdf.quad(subject1, ns.ex.property1, rdf.literal('value1'))
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
    const serializer = new JsonldSerializer({ context, frame: true, skipGraphProperty: true })
    const stream = serializer.import(input)
    const result = (await streamConcat(stream))[0]

    assert.deepStrictEqual(result, jsonld)
  })

  it('should remove @context if skipContext is true', async () => {
    const subject = rdf.blankNode()
    const quads = [
      rdf.quad(subject, ns.rdf.type, ns.ex.Thing),
      rdf.quad(subject, ns.ex.property0, rdf.literal('value0'))
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
    const serializer = new JsonldSerializer({ frame: true, context, skipContext: true })
    const stream = serializer.import(input)
    const result = (await streamConcat(stream))[0]

    assert.deepStrictEqual(result, jsonld)
  })

  it('should support prefixes', async () => {
    const quad = rdf.quad(ns.ex.subject, ns.ex.predicate, rdf.literal('object1'))
    const context = {
      ex: 'http://example.org/'
    }

    const jsonld = {
      '@context': context,
      '@id': 'ex:subject',
      'ex:predicate': 'object1'
    }

    const input = quadsToReadable([quad])
    const serializer = new JsonldSerializer({ compact: true })
    const stream = serializer.import(input)

    input.emit('prefix', 'ex', rdf.namedNode('http://example.org/'))

    const result = (await streamConcat(stream))[0]

    assert.deepStrictEqual(result, jsonld)
  })
})
