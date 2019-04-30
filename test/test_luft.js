const { observe, watch, unwatch } = require("../");
const assert = require("assert");

describe("luft", () => {
  describe(".watch(obj, observer)", () => {
    it("calls the observer when an attribute on the object is changed", () => {
      const state = observe({
        users: {},
        settings: {
          theme: null
        }
      });

      let actual;

      const uid = watch(state.settings, obj => (actual = obj));

      state.settings.theme = "dark";
      assert.deepEqual(actual, { theme: "dark" });

      state.settings.theme = "light";
      assert.deepEqual(actual, { theme: "light" });
    });

    it("calls the observer when a full object is changed", () => {
      const state = observe({
        users: {},
        settings: {
          theme: null
        }
      });

      let actual;

      const uid = watch(state.settings, obj => (actual = obj));

      state.settings = { theme: "dark" };
      assert.deepEqual(actual, { theme: "dark" });
      state.settings = { theme: "light" };
      assert.deepEqual(actual, { theme: "light" });
    });
  });

  describe(".unwatch(uid)", () => {
    it("disables the callback function", () => {
      const state = observe({
        users: {},
        settings: {
          theme: null
        }
      });

      let actual;

      const uid = watch(state.settings, obj => (actual = obj));

      state.settings = { theme: "dark" };
      assert.deepEqual(actual, { theme: "dark" });

      unwatch(uid);

      state.settings = { theme: "light" };
      assert.deepEqual(actual, { theme: "dark" });
    });
  });
});
