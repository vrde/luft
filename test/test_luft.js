const { observe, watch, unwatch } = require("../");
const assert = require("assert");

describe("luft", () => {
  describe(".watch(obj, observer)", () => {
    it("calls the observer when an attribute on the object is changed", done => {
      const state = observe({
        users: {},
        settings: {
          theme: null
        }
      });

      let expectedValue;
      let isDone;

      const uid = watch(state.settings, obj => {
        assert.deepEqual(obj, { theme: expectedValue });
        if (isDone) {
          done();
        }
      });

      expectedValue = "dark";
      state.settings.theme = expectedValue;
      isDone = true;
      expectedValue = "light";
      state.settings.theme = expectedValue;
    });

    it("calls the observer when a full object is changed", done => {
      const state = observe({
        users: {},
        settings: {
          theme: null
        }
      });

      let expectedValue;
      let isDone;

      const uid = watch(state.settings, obj => {
        assert.deepEqual(obj, { theme: expectedValue });
        if (isDone) {
          done();
        }
      });

      expectedValue = "dark";
      state.settings = { theme: "dark" };
      isDone = true;
      expectedValue = "light";
      state.settings = { theme: "light" };
    });
  });
});
