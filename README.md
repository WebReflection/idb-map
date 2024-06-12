# @webreflection/idb-map

<sup>**Social Media Photo by [delfi de la Rua](https://unsplash.com/@delfidelarua7) on [Unsplash](https://unsplash.com/)**</sup>

An IndexedDB based Map with an asynchronous interface.


## IDBMap API

An *IDBMap* instance implements all [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) methods or accessors except these are all **asynchroonus**.

An *IDBMap* also extends [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget) too, so `dispatchEvent` is also available, among others. Handled events are by default `abort`, `close`, `error` and `versionchange`.

The *IDBMap* **constructor** is the only main different *API* compared to *Map*:

  * it accepts a database's `name` suffix as *string*. The DB will be called `'IDBMap/${name}'`. The storage name used for this *db* will be *entries*. An *empty* string is also a valid name but please be aware of naming collisions
  * it accepts an optional `options` object, currently to either override transactions' **durability**, where its default value is `'default'`, or to use a different database **prefix** name which default value is `'IDBMap'`

```ts
type IDBMapOptions = {
    durability?: 'strict' | 'relaxed' | 'default';
    prefix?: string;
}

class IDBMap extends EventTarget implements Map {
  constructor(
    name:string,
    options:IDBMapOptions = { durability: 'default', prefix: 'IDBMap' }
  ):IDBMap

  // the only extra method not present in Map or EventTarget
  close():Promise<void>
}
```

### Example

```js
import IDBMap from '@webreflection/idb-map';

// create an async map with a generic storage name
const idbMap = new IDBMap('my-storage-name');

// check any Map property by awaiting it
console.log(await idbMap.size);
console.log(await idbMap.has('nope'));

// optional helpers for buffered data
const encoder = new TextEncoder;
const decoder = new TextDecoder;

// set any IDB compatible value
await idbMap.set('test.txt', 'test value');
console.log(await idbMap.has('test.txt'));
await idbMap.set('other.txt', encoder.encode('other value'));

// get any IDB stored value
console.log(await idbMap.get('test.txt'));
console.log(decoder.decode(await idbMap.get('other.txt')));

// retrieve any other async Map API method
console.log(await idbMap.keys());
console.log(await idbMap.size);
for (const entry of await idbMap.entries())
    console.log(entry);

// or remove a single key
await idbMap.delete('other.txt');
console.log(await idbMap.keys());
console.log(await idbMap.size);

// or clear the whole thing
await idbMap.clear();
console.log(await idbMap.keys());
console.log(await idbMap.size);

// eventually close it
await idbMap.close();
```

- - -


### Background / Goal / Why

There are other projects with a similar goal, most popular or notable is [idb-keyval](https://www.npmjs.com/package/idb-keyval), but ...

  * there is no familiar *API* around this topic, everyone offering "*easy IndexedDB*" is kinda proposing a new *API*
  * there is nothing more similar than a *JS*' [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) to actually store *key / value* pairs
  * the *Map* *API* is nothing new to learn, here the *IDBMap* is just about the same except it's inevitably *asynchronous* ... but ...
    * it is still possible via [coincident](https://github.com/WebReflection/coincident#readme) to have this transparently synchronous from a worker (if that's your cup of tea), making the *Map* a 1:1 familiar primitive that will persist its data in user's space
  * the *IDBMap* also extends [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget), forwarding internal events when/if needed
  * the *IDBMap* adds a `.close()` asynchronous method to ensure a db has been successfully closed

That's pretty much it; you already know this module and the only different thing is the way an *IDBMap* is initialized.
