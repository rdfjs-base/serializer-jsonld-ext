import * as Sink from '@rdfjs/sink';
import { EventEmitter } from 'events';
import { Context } from 'jsonld/jsonld-spec';
import { Stream } from 'rdf-js';

interface SerializerOptions {
  context?: Context;
  compact?: boolean;
  encoding?: 'string' | 'object';
  flatten?: boolean;
  frame?: boolean;
  skipContext?: boolean;
  skipGraphProperty?: boolean;
}

declare class Serializer extends Sink {
  constructor(options?: SerializerOptions);

  import(stream: Stream, options?: SerializerOptions): EventEmitter;
}

export = Serializer
