// Type declarations for Cloudflare Workers
declare interface DurableObjectState {
  storage: DurableObjectStorage;
  blockConcurrencyWhile(callback: () => Promise<void>): Promise<void>;
}

declare interface DurableObjectStorage {
  get(key: string, options?: { type: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<any>;
  put(key: string, value: any, options?: { expiration?: number }): Promise<void>;
  delete(key: string): Promise<boolean>;
  list(options?: { prefix?: string, limit?: number, cursor?: string }): Promise<Map<string, any>>;
}

declare interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  idFromString(id: string): DurableObjectId;
  newUniqueId(): DurableObjectId;
  get(id: DurableObjectId): DurableObject;
}

declare interface DurableObjectId {
  toString(): string;
  equals(other: DurableObjectId): boolean;
}

declare interface DurableObject {
  fetch(request: Request): Promise<Response>;
}

declare interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream', cacheTtl?: number }): Promise<any>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expiration?: number, expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string, limit?: number, cursor?: string }): Promise<{ keys: { name: string, expiration?: number }[], list_complete: boolean, cursor?: string }>;
}

declare interface R2Bucket {
  get(key: string, options?: { range?: { offset: number, length: number }, onlyIf?: { etagMatches?: string, etagDoesNotMatch?: string, uploadedAfter?: Date, uploadedBefore?: Date } }): Promise<R2Object | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: { httpMetadata?: R2HTTPMetadata, customMetadata?: Record<string, string> }): Promise<R2PutResult>;
  delete(keys: string | string[]): Promise<void>;
  list(options?: { prefix?: string, delimiter?: string, limit?: number, cursor?: string }): Promise<R2Objects>;
  head(key: string): Promise<R2Object | null>;
}

declare interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
  body: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T>(): Promise<T>;
}

declare interface R2HTTPMetadata {
  contentType?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
  cacheExpiry?: Date;
}

declare interface R2PutResult {
  key: string;
  version: string;
  etag: string;
  httpEtag: string;
  uploaded: Date;
}

declare interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

declare interface Queue {
  send(message: any): Promise<void>;
  sendBatch(messages: any[]): Promise<void>;
}

declare interface MessageBatch<T = any> {
  queue: string;
  messages: {
    id: string;
    timestamp: number;
    body: T;
    ack: () => void;
    retry: () => void;
  }[];
}

declare interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

declare interface VectorizeIndex {
  insert(id: string, values: number[], metadata?: object): Promise<void>;
  query(values: number[], options?: { topK?: number, filter?: object }): Promise<{ id: string, score: number, metadata?: object }[]>;
  getByIds(ids: string[]): Promise<{ id: string, values: number[], metadata?: object }[]>;
  delete(ids: string | string[]): Promise<void>;
}

interface Ai {
  run<T = any>(model: string, inputs: any): Promise<T>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}
