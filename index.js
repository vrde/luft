class Handler {
  constructor() {
    this.observers = {};
    this.uid = 0;
  }

  set(obj, prop, value, receiver) {
    const oldProxy = obj[prop];
    const result = Reflect.set(obj, prop, value, receiver);
    if (prop.startsWith("__")) {
      return result;
    }
    value = observe(value, obj);
    this.notify(receiver);
    if (oldProxy.__handler) {
      value.__handler = oldProxy.__handler;
      value.__handler.notify(receiver[prop]);
    }
    return result;
  }

  subscribe(observer) {
    this.uid++;
    this.observers[this.uid] = observer;
    return this.uid;
  }

  notify(receiver) {
    Object.keys(this.observers).map(uid => {
      this.observers[uid](receiver);
    });
  }

  unsubscribe(uid) {
    delete this.observers[this.uid];
  }
}

function observe(obj, parent = undefined) {
  if (
    // Cannot observe null/undefined values
    obj === null ||
    obj === undefined ||
    // Cannot observe already observed objects
    obj.__handler ||
    // Cannot observe raw values
    (obj.constructor !== Object && obj.constructor !== Array)
  ) {
    return obj;
  }

  let t = obj.constructor();
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    t[key] = observe(obj[key], obj);
  }
  const handler = new Handler();
  const proxy = new Proxy(t, handler);
  Object.defineProperty(proxy, "__handler", { value: handler, writable: true });
  Object.defineProperty(proxy, "__parent", { value: parent, writable: true });
  return proxy;
}

function watch(obj, observer) {
  if (obj.__handler) {
    obj.__handler.subscribe(observer);
  } else {
    throw new Error(
      "Cannot watch the target object, " +
        "it doesn't implement an observable interface"
    );
  }
}

function unwatch(obj) {}

module.exports = {
  observe,
  watch
};
