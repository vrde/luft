const { observe, watch } = require("../");
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

      watch(state.settings, obj => {
        assert.deepEqual(obj, { theme: "dark" });
        done();
      });

      state.settings.theme = "dark";
    });

    it("calls the observer when a full object is changed", done => {
      const state = observe({
        users: {},
        settings: {
          theme: null
        }
      });

      watch(state.settings, obj => {
        assert.deepEqual(obj, { theme: "dark" });
        done();
      });

      state.settings = {
        theme: "dark"
      };
    });
  });
});
