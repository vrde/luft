import assert from "assert";
import { emitter, $, action, subscribe, getValue, setValue } from "../src";

describe("luft", () => {
  it("getValue", () => {
    assert.equal(
      getValue(["foo", "bar", "baz"], { foo: { bar: { baz: 666 } } }),
      666
    );
    assert.equal(
      getValue(["foo", "bar", "baz", "nope"], { foo: { bar: { baz: 666 } } }),
      undefined
    );
    assert.equal(
      getValue(["foo", "bar", "baz", "nope"], {}, "fallback"),
      "fallback"
    );
  });

  it("setValue", () => {
    const d = {};
    setValue(d, ["foo", "bar", "baz"], 666);
    assert.equal(d.foo.bar.baz, 666);
  });

  it("watches things change", () => {
    const state = emitter({
      setPoint: action((state, x, y) => {
        state.point.x = x;
        state.point.y = y;
      }),
      point: { x: undefined, y: undefined },
      x: $(x => x, "point.x"),
      sum: $((x, y) => x + y, "point.x", "point.y"),
      timesTwo: $(sum => sum * 2, "sum")
    });

    let calledX, calledTimesTwo;
    subscribe(
      (x, timesTwo) => {
        (calledX = x), (calledTimesTwo = timesTwo);
      },
      "x",
      "timesTwo"
    );
    state.setPoint(1, 10);
    //state.point.x = 1;
    //state.point.y = 10;
    assert.equal(calledX, 1);
    assert.equal(calledTimesTwo, 22);
  });

  it("updates on already defined props", () => {
    const state = emitter({
      celsius: 100,
      fahrenheit: $(c => (c * 9) / 5 + 32, "celsius")
    });
    assert.equal(state.celsius, 100);
    assert.equal(state.fahrenheit, 212);
  });

  it("updates stuff", () => {
    const state = emitter({
      celsius: undefined,
      fahrenheit: $(c => (c * 9) / 5 + 32, "celsius")
    });

    state.celsius = 0;
    assert.equal(state.celsius, 0);
    assert.equal(state.fahrenheit, 32);

    state.celsius = 100;
    assert.equal(state.celsius, 100);
    assert.equal(state.fahrenheit, 212);
  });

  it("updates stuff again", () => {
    const state = emitter({
      point: { x: undefined, y: undefined },
      x: $(x => x, "point.x"),
      sum: $((x, y) => x + y, "point.x", "point.y"),
      timesTwo: $(sum => sum * 2, "sum")
    });

    state.point.x = 1;
    state.point.y = 10;
    assert.equal(state.sum, 11);
    assert.equal(state.timesTwo, 22);
    assert.equal(state.x, 1);
  });
});
