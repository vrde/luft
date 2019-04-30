const OBSERVERS_TO_HANDLERS = {};
let OBSERVERS_UID = 0;

class Handler {
  constructor() {
    this.observers = {};
  }

  set(obj, prop, value, receiver) {
    const newProxy = observe(value, obj);
    const oldProxy = obj[prop];
    const result = Reflect.set(obj, prop, newProxy, receiver);
    if (prop.startsWith("__")) {
      return result;
    }
    this.notify(receiver);
    if (oldProxy && oldProxy.__handler) {
      newProxy.__handler = oldProxy.__handler;
      newProxy.__handler.notify(receiver[prop]);
    }
    return result;
  }

  subscribe(observer) {
    OBSERVERS_UID++;
    OBSERVERS_TO_HANDLERS[OBSERVERS_UID] = this;
    this.observers[OBSERVERS_UID] = observer;
    return OBSERVERS_UID;
  }

  notify(receiver) {
    Object.keys(this.observers).map(uid => {
      this.observers[uid](receiver);
    });
  }

  unsubscribe(uid) {
    const handler = OBSERVERS_TO_HANDLERS[uid];
    delete OBSERVERS_TO_HANDLERS[uid];
    delete handler.observers[uid];
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
    return obj.__handler.subscribe(observer);
  } else {
    throw new Error(
      "Cannot watch the target object, " +
        "it doesn't implement an observable interface"
    );
  }
}

function unwatch(uid) {
  const handler = OBSERVERS_TO_HANDLERS[uid];
  delete OBSERVERS_TO_HANDLERS[uid];
  delete handler.observers[uid];
}

module.exports = {
  observe,
  watch,
  unwatch
};
