import IDBMap from './index.js';

export default class IDBMapSync extends Map {
  #map;
  #queue;
  constructor(...args) {
    super();
    this.#map = new IDBMap(...args);
    this.#queue = this.#map.entries().then(entries => {
      for (const [key, value] of entries)
        super.set(key, value);
    });
  }
  async close() {
    await this.#queue;
    await this.#map.close();
  }
  async sync() {
    await this.#queue;
  }
  clear() {
    this.#queue = this.#queue.then(() => this.#map.clear());
    return super.clear();
  }
  delete(key) {
    this.#queue = this.#queue.then(() => this.#map.delete(key));
    return super.delete(key);
  }
  set(key, value) {
    this.#queue = this.#queue.then(() => this.#map.set(key, value));
    return super.set(key, value);
  }
}
