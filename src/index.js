import { useState, useEffect } from "react";

let REGISTRY_UID = 0;
let REGISTRY_PATHS = {};
const ROOT = {};

class Hub {
  constructor() {
    this.callbacks = {};
  }

  emit(path, value) {
    let parentPath = [...path];
    parentPath.pop();
    const parentCallbacks = this.callbacks[parentPath] || {};
    let callbacks = this.callbacks[path] || {};
    callbacks = { ...callbacks, ...parentCallbacks };
    Object.keys(callbacks)
      .map(key => callbacks[key])
      .forEach(({ f, paths }) => f(...getValues(ROOT.value, paths)));
  }

  subscribe(f, ...paths) {
    REGISTRY_UID++;
    REGISTRY_PATHS[REGISTRY_UID] = [];

    paths.forEach(path => {
      REGISTRY_PATHS[REGISTRY_UID].push(path);
      if (!this.callbacks[path]) {
        this.callbacks[path] = {};
      }
      this.callbacks[path][REGISTRY_UID] = { f, paths };
    });
    return REGISTRY_UID;
  }

  unsubscribe(uid) {
    REGISTRY_PATHS[uid].forEach(path => {
      delete this.callbacks[path][uid];
    });
  }
}

const HUB = new Hub();

function getPath(obj, prop) {
  //console.log("getPath", obj && obj.__path, prop);
  const r =
    obj && obj.__path ? [...obj.__path, prop] : prop ? [prop] : undefined;
  //console.log("path", r);
  return r;
  // return obj && obj.__path ? [obj.__path, prop].join(".") : prop;
}

export function toPath(whatever) {
  if (whatever.constructor === String) {
    return whatever.split(".");
  }
  if (whatever.__path) {
    return whatever.__path;
  }
  return whatever;
}

function getValues(obj, paths) {
  paths = paths.map(toPath);
  return paths.map(path => getValue(obj, path));
}

export function getValue(obj, path, fallback) {
  try {
    return path.reduce((acc, cur) => acc[cur], obj);
  } catch (e) {
    if (e instanceof TypeError) {
      if (fallback !== undefined) {
        return fallback;
      } else {
        throw e;
      }
    }
  }
}

export function setValue(obj, path, value) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    cur[path[i]] = cur[path[i]] || {};
    cur = cur[path[i]];
  }

  if (value instanceof Promise) {
    value.then(v => (cur[path[path.length - 1]] = v));
  } else {
    cur[path[path.length - 1]] = value;
  }

  return cur;
}

class Handler {
  set(obj, prop, value, receiver) {
    const oldProxy = obj[prop];
    const newProxy = _emitter(value, obj, prop);
    const result = Reflect.set(obj, prop, newProxy, receiver);
    HUB.emit(getPath(obj, prop), newProxy);
    return result;
  }
}

export function emitter(obj, parent = undefined, prop = undefined) {
  ROOT.value = _emitter(...arguments);
  refresh(ROOT.value);
  return ROOT.value;
}

function _emitter(obj, parent = undefined, prop = undefined) {
  if (
    // Cannot observe null/undefined values
    obj === null ||
    obj === undefined ||
    // Don't observe already observed objects
    obj.__handler ||
    // Don't observe raw values
    (obj.constructor !== Object && obj.constructor !== Array)
  ) {
    return obj;
  }

  const path = getPath(parent, prop);

  // Don't observe value placeholders
  if (obj.hasOwnProperty("__type")) {
    if (obj.__type === "value") {
      const { f, paths } = obj;
      HUB.subscribe(
        (...values) => setValue(ROOT.value, path, f(...values)),
        ...paths
      );
      return;
    } else if (obj.__type === "action") {
      const { f } = obj;
      return (...args) => f(ROOT.value, ...args);
    }
  }

  const t = obj.constructor();
  const handler = new Handler();
  const proxy = new Proxy(t, handler);

  Object.defineProperty(proxy, "__handler", { value: handler, writable: true });
  Object.defineProperty(proxy, "__path", {
    value: path,
    writable: true
  });

  Object.keys(obj).forEach(key => (t[key] = _emitter(obj[key], proxy, key)));

  return proxy;
}

export function refresh(obj) {
  if (
    obj !== null &&
    obj !== undefined &&
    (obj.constructor === Object || obj.constructor === Array)
  ) {
    Object.keys(obj).forEach(key => {
      obj[key] = refresh(obj[key]);
    });
  }
  return obj;
}

export function $(f, ...paths) {
  paths = paths.map(toPath);
  return {
    __type: "value",
    f,
    paths
  };
}

export function action(f) {
  return {
    __type: "action",
    f
  };
}

export function subscribe(f, ...paths) {
  paths = paths.map(toPath);
  return HUB.subscribe((...values) => {
    f(...values);
  }, ...paths);
}

export function unsubscribe(uid) {
  HUB.unsubscribe(uid);
}

export function useLuft(...paths) {
  const [val, setVal] = useState([]);
  useEffect(() => {
    const uid = subscribe(() => setVal(arguments), ...paths);
    const mem = { uid };
    return () => unsubscribe(mem.uid);
  });
  return getValues(ROOT.value, paths);
}
