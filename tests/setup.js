// tests/setup.js
class LocalStorageMock {
  constructor() {
    this.store = {}
  }
  clear() {
    this.store = {}
  }
  getItem(key) {
    return this.store[key] || null
  }
  setItem(key, value) {
    this.store[key] = String(value)
  }
  removeItem(key) {
    delete this.store[key]
  }
  get length() {
    return Object.keys(this.store).length
  }
  key(i) {
    const keys = Object.keys(this.store)
    return keys[i] || null
  }
}

const mock = new LocalStorageMock()
Object.defineProperty(globalThis, 'localStorage', {
  value: mock,
  writable: true,
  configurable: true,
})
