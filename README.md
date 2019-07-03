# @rdfjs/serializer-jsonld-ext

[![Build Status](https://travis-ci.org/rdfjs/serializer-jsonld-ext.svg?branch=master)](https://travis-ci.org/rdfjs/serializer-jsonld-ext)

[![npm version](https://img.shields.io/npm/v/@rdfjs/serializer-jsonld-ext.svg)](https://www.npmjs.com/package/@rdfjs/serializer-jsonld-ext)

JSON-LD serializer that implements the [RDFJS Sink interface]((https://github.com/rdfjs/representation-task-force/)) and supports different output styles.
This package handles the stream processing and uses [jsonld.js](https://github.com/digitalbazaar/jsonld.js) for the actual serialization process. 

## Usage

The package exports the serializer as a class, so an instance must be created before it can be used.
The `.import` method, as defined in the [RDFJS specification](http://rdf.js.org/#sink-interface), must be called to do the actual serialization.
It expects a quad stream as argument.
The method will return a stream which emits the JSON-LD as a plain object or string.

The constructor accepts an `options` object with the following optional keys:

- `context`: JSON-LD context that will be used for compact, flatten or frame.
  The context must be given as a plain object.
  By default `{}` is used.
- `compact`: If this flag is `true`, the jsonld.js compact will be used to process the output. 
- `flatten`: If this flag is `true`, the jsonld.js flatten will be used to process the output.
- `frame`: If this flag is `true`, the jsonld.js frame will be used to process the output.
- `skipContext`: Removes the `@context` property from the output.
  Useful for HTTP server when the media type `application/json` is used and a context is provided as header link. 
- `skipGraphProperty`: Tries to get rid of the intermediate `@graph` property.
  If `@graph` contains more than one element, this option will be ignored as it would cause data loss. 
- `encoding`: Defines the encoding of the output.
  Supported encodings are `string` and `object`.
  By default `object` is used.

It's also possible to pass options as second argument to the `.import` method.
The options from the constructor and the `.import` method will be merged together.

### Example

This example shows how to create a serializer instance and how to feed it with a stream of quads.
The output will be processed with `compact` using the given context. 
The object emitted by the serializer will be written to the console.

```javascript
const rdf = require('@rdfjs/data-model')
const Readable = require('stream').Readable
const SerializerJsonld = require('@rdfjs/serializer-jsonld-ext')

const context = {
  '@vocab': 'http://schema.org/',
  ex: 'http://example.org/'
}

const serializerJsonld = new SerializerJsonld({ context, compact: true })
const input = new Readable({
  objectMode: true,
  read: () => {
    input.push(rdf.quad(
      rdf.namedNode('http://example.org/sheldon-cooper'),
      rdf.namedNode('http://schema.org/givenName'),
      rdf.literal('Sheldon')))
    input.push(rdf.quad(
      rdf.namedNode('http://example.org/sheldon-cooper'),
      rdf.namedNode('http://schema.org/familyName'),
      rdf.literal('Cooper')))
    input.push(rdf.quad(
      rdf.namedNode('http://example.org/sheldon-cooper'),
      rdf.namedNode('http://schema.org/knows'),
      rdf.namedNode('http://example.org/amy-farrah-fowler')))
    input.push(null)
  }
})
const output = serializerJsonld.import(input)

output.on('data', jsonld => {
  console.log(jsonld)
})
```
