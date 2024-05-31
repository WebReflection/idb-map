const { assign } = Object;

const READONLY = 'readonly';
const READWRITE = 'readwrite';

/**
 * @typedef {Object} IDBTransactionOptions
 * @prop {'strict' | 'relaxed' | 'default'} durability
 */

/** @typedef {[IDBValidKey, unknown]} IDBMapEntry */

/** @type {IDBTransactionOptions} */
const defaultOptions = { durability: 'default' };

const events = new Set(['abort', 'close', 'error', 'versionchange']);

/**
 * @template T
 * @param {{ target: IDBRequest<T> }} event
 * @returns {T}
 */
const result = ({ target: { result } }) => result;

export default class IDBMap extends EventTarget {
  // Privates
  /** @type {Promise<IDBDatabase>} */   #db;
  /** @type {string} */                 #name;
  /** @type {IDBTransactionOptions} */  #options;

  /**
   * @template T
   * @param {(store: IDBObjectStore) => IDBRequest<T>} what
   * @param {'readonly' | 'readwrite'} how
   * @returns {Promise<T>}
   */
  async #transaction(what, how) {
    const db = await this.#db;
    const t = db.transaction(this.#name, how, this.#options);
    return new Promise((onsuccess, onerror) => assign(
      what(t.objectStore(this.#name)),
      {
        onsuccess,
        onerror,
      }
    ));
  }

  /**
   * @param {string} name
   * @param {IDBTransactionOptions} options
   */
  constructor(name = '', options = defaultOptions) {
    super();
    this.#name = name;
    this.#options = options;
    this.#db = new Promise((resolve, reject) => {
      assign(
        indexedDB.open('IDBMap'),
        {
          onupgradeneeded({ target: { result, transaction } }) {
            if (!result.objectStoreNames.contains(name))
              result.createObjectStore(name);
            transaction.oncomplete = () => resolve(result);
          },
          onsuccess(event) {
            resolve(result(event));
          },
          onerror(event) {
            reject(event);
            this.dispatchEvent(event);
          },
        },
      );
    }).then(result => {
      const boundDispatch = this.dispatchEvent.bind(this);
      for (const key in result) {
        if (key.startsWith('on'))
          result[key] = boundDispatch;
      }
      return result;
    });
  }

  // EventTarget Forwards
  /**
   * @param {Event} event
   * @returns 
   */
  dispatchEvent(event) {
    const { type, message } = event;
    return super.dispatchEvent(
      // avoid re-dispatching of the same event
      events.has(type) ?
        assign(new Event(type), { message }) :
        event
    );
  }

  // IDBDatabase Forwards
  async close() {
    (await this.#db).close();
  }

  // Map async API
  get size() {
    return this.#transaction(
      store => store.count(),
      READONLY,
    ).then(result);
  }

  async clear() {
    await this.#transaction(
      store => store.clear(),
      READWRITE,
    );
  }

  /**
   * @param {IDBValidKey} key
   */
  async delete(key) {
    await this.#transaction(
      store => store.delete(key),
      READWRITE,
    );
  }

  async keys() {
    const keys = await this.#transaction(
      store => store.getAllKeys(),
      READONLY,
    ).then(result);
    return keys;
  }

  async values() {
    const keys = await this.keys();
    return Promise.all(keys.map(key => this.get(key)));
  }

  /**
   * @returns {Promise<IDBMapEntry[]>}
   */
  async entries() {
    const keys = await this.keys();
    return Promise.all(keys.map(key => this.get(key).then(value => [key, value])));
  }

  /**
   * @param {(unknown, IDBValidKey, IDBMap) => void} callback
   * @param {unknown} [context]
   */
  async forEach(callback, context = this) {
    for (const [key, value] of await this.entries())
      await callback.call(context, value, key, this);
  }

  /**
   * @param {IDBValidKey} key
   * @returns {Promise<unknown | undefined>}
   */
  async get(key) {
    const value = await this.#transaction(
      store => store.get(key),
      READONLY,
    ).then(result);
    return value;
  }

  /**
   * @param {IDBValidKey} key
   */
  async has(key) {
    const k = await this.#transaction(
      store => store.getKey(key),
      READONLY,
    ).then(result);
    return k !== void 0;
  }

  /**
   * @param {IDBValidKey} key
   * @param {unknown} value
   */
  async set(key, value) {
    await this.#transaction(
      store => store.put(value, key),
      READWRITE,
    );
    return this;
  }
}
