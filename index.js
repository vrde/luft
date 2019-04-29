import React, { Component } from "react";

function addLog(action, path, obj, receiver, prop, oldValue, newValue) {
  logState.push({
    action,
    path,
    obj,
    receiver,
    prop,
    oldValue,
    newValue
  });
}

class Handler {
  constructor() {
    this._observers = [];
  }
  set(obj, prop, value, receiver) {
    let r;
    const path = [obj.__path, prop].join(".");
    if (path.startsWith(".__")) {
      r = Reflect.set(obj, prop, value, receiver);
    } else {
      if (!path.startsWith("<log>")) {
        addLog("set", path, obj, receiver, prop, obj[prop], value);
        value = observe(value, path);
      }
      r = Reflect.set(obj, prop, value, receiver);
      this._observers.map(observer => observer(obj, prop, value, receiver));
    }
    return r;
  }

  observe(observer) {
    this._observers.push(observer);
  }
}

export function watch(WrappedComponent) {
  return class extends Component {
    componentDidMount() {
      const keys = Object.keys(this.props);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (this.props[key].__handler) {
          this.props[key].__handler.observe(() => this.forceUpdate());
        }
      }
    }
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}

export function observe(obj, path = "<root>") {
  console.log("observe", obj);
  if (obj && (obj.constructor === Object || obj.constructor === Array)) {
    let t = obj.constructor();
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      t[key] = observe(obj[key], [path, key].join("."));
    }
    const handler = new Handler();
    const proxy = new Proxy(t, handler);
    proxy.__handler = handler;
    proxy.__path = path;
    return proxy;
  } else {
    return obj;
  }
}

export const logState = observe([], "<log>");
