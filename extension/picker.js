(() => {
  // extension/src/core/recipes.js
  function fourierPath(state) {
    const { harmonics, amplitude, phase } = state;
    if (!Number.isInteger(harmonics) || harmonics < 1 || harmonics > 12 || !Number.isFinite(amplitude) || amplitude < 0 || amplitude > 1.5 || !Number.isFinite(phase) || phase < -3.14 || phase > 3.14) throw Error("Fourier \u53C2\u6570\u8D85\u9650");
    const points = [];
    for (let i = 0; i <= 240; i++) {
      const x = i / 240 * 2 * Math.PI;
      let y = 0;
      for (let n = 1; n <= harmonics; n++) y += Math.sin(n * x + phase) / n;
      points.push((i ? "L" : "M") + (i * 2.5).toFixed(2) + "," + (90 - y * amplitude * 32).toFixed(2));
    }
    return points.join(" ");
  }
  function tableOrder(rows, state) {
    if (!Number.isFinite(state.minimum) || state.minimum < 0 || state.minimum > 50 || !["asc", "desc"].includes(state.direction) || rows.length > 200 || rows.some((r) => r.length !== 2 || r.some((c) => typeof c !== "string" || c.length > 100) || !Number.isFinite(Number(r[1])) || Number(r[1]) < 0 || Number(r[1]) > 50)) throw Error("\u8868\u683C\u53C2\u6570\u8D85\u9650");
    return rows.map((_, i) => i).filter((i) => Number(rows[i][1]) >= state.minimum).sort((a, b) => (Number(rows[a][1]) - Number(rows[b][1])) * (state.direction === "asc" ? 1 : -1) || a - b);
  }

  // extension/src/core/adapters.js
  var definitions = {
    "fourier@1": { bindings: ["root", "harmonics", "amplitude", "phase", "curve", "output"], state: ["harmonics", "amplitude", "phase"] },
    "table@1": { bindings: ["root", "filter", "sort", "body", "output"], state: ["minimum", "direction"] },
    "tabs@1": { bindings: ["root", "tabs", "panels"], arrays: ["tabs", "panels"], state: ["active"] },
    "calculator@1": { bindings: ["root", "left", "right", "output"], state: ["left", "right"] },
    "state@1": { bindings: ["root", "control", "panels"], arrays: ["panels"], state: ["active"] },
    "native-details@1": { bindings: ["root"], state: [], native: true }
  };
  var adapterRegistry = Object.freeze(Object.fromEntries(Object.entries(definitions).map(([recipe, d]) => [recipe, Object.freeze({ recipe, ...d, roles: Object.freeze(d.bindings.filter((k) => k !== "root").map((k) => k === "tabs" ? "tab" : k === "panels" ? "panel" : k)), arrayRoles: Object.freeze(Object.fromEntries((d.arrays || []).map((k) => [k, k === "tabs" ? "tab" : "panel"]))), bindings: Object.freeze(d.bindings), state: Object.freeze(d.state), arrays: Object.freeze(d.arrays || []), capability: d.native ? "native-preserved" : "model-validated" })])));
  var getAdapter = (recipe) => Object.hasOwn(adapterRegistry, recipe) ? adapterRegistry[recipe] : null;
  var bindingPaths = (b) => Object.values(b).flatMap((v) => Array.isArray(v) ? v : [v]);
  function sumValue(left, right) {
    for (const n of [left, right]) if (!Number.isFinite(n) || n < -100 || n > 100 || Math.abs(n * 100 - Math.round(n * 100)) > 1e-8) throw Error("\u8BA1\u7B97\u53C2\u6570\u8D85\u9650\u6216\u6B65\u957F\u4E0D\u5339\u914D");
    return String(Number((left + right).toFixed(2)));
  }

  // extension/src/core/sources.js
  var blocked = (h) => h === "chatgpt.com" || h.endsWith(".chatgpt.com") || h === "chat.openai.com" || h.endsWith(".chat.openai.com");
  function sourceAdapter(url, { controlled = false, file = false } = {}) {
    if (file) return { id: "local-file@1", level: "external-unverified", finiteModels: false, evidence: "model-validated-v1" };
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol) || blocked(u.hostname)) throw Error("\u6765\u6E90\u672A\u901A\u8FC7\u91C7\u96C6\u8BB8\u53EF Gate");
    if (controlled === true) return { id: "user-contract@1", level: "controlled", finiteModels: true, evidence: "model-validated-v1" };
    return { id: "generic-dom@1", level: "general", finiteModels: false, evidence: null };
  }
  var sourceContracts = Object.freeze(["user-contract@1", "generic-dom@1", "local-file@1"]);

  // extension/src/core/interactions.js
  function nodes(tree) {
    const map = /* @__PURE__ */ new Map();
    function walk(n, path) {
      map.set(path, n);
      n.children?.forEach((c, i) => walk(c, path + "." + i));
    }
    walk(tree, "0");
    return map;
  }
  var exact = (o, keys) => o && typeof o === "object" && !Array.isArray(o) && Object.keys(o).length === keys.length && keys.every((k) => Object.hasOwn(o, k));
  var text = (n) => n.text ?? n.children.map(text).join("");
  function tableRows(n) {
    if (n.tag !== "tbody" || n.children.length > 200 || n.children.some((r) => r.tag !== "tr" || r.children.length !== 2 || r.children.some((c) => c.tag !== "td"))) throw Error("\u8868\u683C\u7ED3\u6784\u4E0D\u5339\u914D");
    return n.children.map((r) => r.children.map(text));
  }
  function validateLegacyBehaviors(s) {
    const bs = s.behaviors || [];
    if (!Array.isArray(bs) || bs.length > 20) throw Error("\u4EA4\u4E92\u6570\u91CF\u8D85\u9650");
    const map = nodes(s.tree), used = /* @__PURE__ */ new Set();
    for (const b of bs) {
      if (!exact(b, ["recipe", "bindings", "state", "evidence"]) || !["fixture-equivalence-v1", "model-validated-v1"].includes(b.evidence)) throw Error("\u4EA4\u4E92\u8BC1\u636E\u5B57\u6BB5\u4E0D\u5408\u6CD5");
      const keys = b.recipe === "fourier@1" ? ["root", "harmonics", "amplitude", "phase", "curve", "output"] : b.recipe === "table@1" ? ["root", "filter", "sort", "body", "output"] : null;
      if (!keys || !exact(b.bindings, keys)) throw Error("\u4EA4\u4E92 recipe \u4E0D\u652F\u6301");
      if (new Set(Object.values(b.bindings)).size !== keys.length) throw Error("\u4EA4\u4E92\u7ED1\u5B9A\u91CD\u590D");
      for (const root of used) {
        if (root === b.bindings.root || root.startsWith(b.bindings.root + ".") || b.bindings.root.startsWith(root + ".")) throw Error("\u7EC4\u4EF6\u7ED1\u5B9A\u8303\u56F4\u91CD\u53E0");
      }
      const refs = {};
      for (const k of keys) {
        const path = b.bindings[k];
        if (typeof path !== "string" || !/^0(?:\.\d{1,4}){0,75}$/.test(path) || !map.has(path) || used.has(path)) throw Error("\u4EA4\u4E92\u7ED1\u5B9A\u4E0D\u5408\u6CD5");
        if (k !== "root" && !path.startsWith(b.bindings.root + ".")) throw Error("\u7ED1\u5B9A\u8D85\u51FA\u7EC4\u4EF6");
        refs[k] = map.get(path);
        used.add(path);
      }
      if (refs.root.ns !== "html" || !["section", "div", "article"].includes(refs.root.tag) || refs.output.tag !== "output" || refs.output.ns !== "html") throw Error("\u7EC4\u4EF6\u7ED3\u6784\u4E0D\u5339\u914D");
      const parentPath = (p) => p.slice(0, p.lastIndexOf(".")), parent = (k) => map.get(parentPath(b.bindings[k]));
      for (let p = parentPath(b.bindings.root); p; p = parentPath(p)) {
        const n = map.get(p);
        if (n?.ns !== "html" || !["main", "section", "div", "article", "aside", "header", "figure", "details"].includes(n.tag)) throw Error("\u7EC4\u4EF6\u7956\u5148\u7ED3\u6784\u4E0D\u5339\u914D");
      }
      const safeWrappers = /* @__PURE__ */ new Set(["div", "section", "header", "label", "ul", "ol", "li"]);
      const belowRoot = (p) => {
        for (let q = p; q !== b.bindings.root; q = parentPath(q)) {
          if (!q || !map.has(q) || map.get(q).ns !== "html" || !safeWrappers.has(map.get(q).tag)) return false;
        }
        return true;
      };
      const direct = (k) => belowRoot(parentPath(b.bindings[k]));
      const plain = (n) => n.children.every((c) => Object.hasOwn(c, "text"));
      if (!direct("output") || !plain(refs.output)) throw Error("\u8F93\u51FA\u7ED3\u6784\u4E0D\u5339\u914D");
      const controlPosition = (k) => direct(k) || parent(k)?.tag === "label" && parent(k)?.ns === "html" && parentPath(parentPath(b.bindings[k])) === b.bindings.root;
      if (b.recipe === "fourier@1") {
        if (!["harmonics", "amplitude", "phase"].every(controlPosition) || parent("curve")?.tag !== "svg" || parent("curve")?.ns !== "svg" || !belowRoot(parentPath(parentPath(b.bindings.curve)))) throw Error("Fourier \u7ED3\u6784\u4E0D\u5339\u914D");
      } else if (!controlPosition("filter") || !direct("sort") || !plain(refs.sort) || refs.body.ns !== "html" || parent("body")?.tag !== "table" || parent("body")?.ns !== "html" || !belowRoot(parentPath(parentPath(b.bindings.body)))) throw Error("\u8868\u683C\u7ED3\u6784\u4E0D\u5339\u914D");
      const isText = (n) => Object.hasOwn(n, "text");
      const labels = new Set(keys.filter((k) => ["harmonics", "amplitude", "phase", "filter"].includes(k)).map((k) => parent(k)).filter((n) => n?.tag === "label"));
      const controls = new Set(keys.filter((k) => ["harmonics", "amplitude", "phase", "filter"].includes(k)).map((k) => refs[k]));
      for (const label of labels) if (!label.children.every((n) => isText(n) || controls.has(n))) throw Error("\u6807\u7B7E\u7ED3\u6784\u4E0D\u5339\u914D");
      const graphic = b.recipe === "fourier@1" ? parent("curve") : parent("body");
      const allowedRoot = /* @__PURE__ */ new Set([...controls, ...labels, refs.output, graphic, ...refs.sort ? [refs.sort] : []]);
      const safeChild = (n) => isText(n) || allowedRoot.has(n) || n.ns === "html" && ["h1", "h2", "h3", "h4", "p", "button"].includes(n.tag) && plain(n) || n.ns === "html" && safeWrappers.has(n.tag) && n.children.every(safeChild);
      if (!refs.root.children.every(safeChild)) throw Error("\u7EC4\u4EF6\u5B50\u8282\u70B9\u7ED3\u6784\u4E0D\u5339\u914D");
      if (b.recipe === "fourier@1") {
        const svgTags = /* @__PURE__ */ new Set(["svg", "g", "path", "rect", "circle", "line", "polyline", "polygon", "ellipse", "text", "tspan", "defs", "lineargradient", "radialgradient", "stop", "clippath", "mask", "title", "desc"]);
        const svgSafe = (n) => isText(n) || n.ns === "svg" && svgTags.has(n.tag.toLowerCase()) && n.children.every(svgSafe);
        if (!svgSafe(graphic)) throw Error("SVG \u5B50\u6811\u7ED3\u6784\u4E0D\u5339\u914D");
      } else {
        const row = (n) => n.ns === "html" && n.tag === "tr" && n.children.every((c) => c.ns === "html" && ["td", "th"].includes(c.tag) && plain(c));
        if (!graphic.children.every((n) => n.ns === "html" && (["thead", "tbody", "tfoot"].includes(n.tag) ? n.children.every(row) : n.tag === "caption" && plain(n)))) throw Error("\u8868\u683C\u5B50\u6811\u7ED3\u6784\u4E0D\u5339\u914D");
      }
      const range = (n, min, max, step, value) => {
        if (n.ns !== "html" || n.tag !== "input" || n.attrs.type !== "range" || Number(n.attrs.min) !== min || Number(n.attrs.max) !== max || Number(n.attrs.step) !== step || Number(n.attrs.value) !== value) throw Error("\u6ED1\u5757\u6A21\u578B\u4E0D\u5339\u914D");
      };
      if (b.recipe === "fourier@1") {
        if (!exact(b.state, ["harmonics", "amplitude", "phase"])) throw Error("Fourier \u72B6\u6001\u5B57\u6BB5\u4E0D\u5408\u6CD5");
        const d = fourierPath(b.state);
        if (refs.curve.tag !== "path" || refs.curve.ns !== "svg" || refs.curve.attrs.d !== d) throw Error("\u66F2\u7EBF\u4E0E\u6A21\u578B\u4E0D\u4E00\u81F4");
        if (Math.abs(b.state.amplitude * 10 - Math.round(b.state.amplitude * 10)) > 1e-8 || Math.abs(b.state.phase * 100 - Math.round(b.state.phase * 100)) > 1e-8) throw Error("\u6570\u503C\u4E0D\u7B26\u5408\u6ED1\u5757\u6B65\u957F");
        range(refs.harmonics, 1, 12, 1, b.state.harmonics);
        range(refs.amplitude, 0, 1.5, 0.1, b.state.amplitude);
        range(refs.phase, -3.14, 3.14, 0.01, b.state.phase);
      } else {
        if (!exact(b.state, ["minimum", "direction"]) || refs.sort.tag !== "button" || refs.sort.ns !== "html" || !Number.isInteger(b.state.minimum)) throw Error("\u8868\u683C\u72B6\u6001\u5B57\u6BB5\u4E0D\u5408\u6CD5");
        tableOrder(tableRows(refs.body), b.state);
        range(refs.filter, 0, 50, 1, b.state.minimum);
      }
    }
    return bs;
  }
  function validateBehaviors(s) {
    const bs = s.behaviors || [];
    if (!Array.isArray(bs) || bs.length > 20) throw Error("\u4EA4\u4E92\u6570\u91CF\u8D85\u9650");
    const map = nodes(s.tree);
    for (const b of bs) {
      const adapter = getAdapter(b?.recipe);
      if (!adapter || adapter.native || !exact(b, ["recipe", "bindings", "state", "evidence"]) || !["fixture-equivalence-v1", "model-validated-v1"].includes(b.evidence) || !exact(b.bindings, adapter.bindings)) throw Error("\u4EA4\u4E92 recipe \u6216\u5B57\u6BB5\u4E0D\u652F\u6301");
      const paths = bindingPaths(b.bindings);
      if (new Set(paths).size !== paths.length) throw Error("\u4EA4\u4E92\u7ED1\u5B9A\u91CD\u590D");
      for (const path of paths) if (typeof path !== "string" || !/^0(?:\.\d{1,4}){0,75}$/.test(path) || !map.has(path) || path !== b.bindings.root && !path.startsWith(b.bindings.root + ".")) throw Error("\u4EA4\u4E92\u7ED1\u5B9A\u4E0D\u5408\u6CD5\u6216\u8D85\u51FA\u7EC4\u4EF6");
      for (const p of paths.filter((p2) => p2 !== b.bindings.root)) for (const q of paths.filter((q2) => q2 !== b.bindings.root)) if (p !== q && p.startsWith(q + ".")) throw Error("\u7EC4\u4EF6\u7ED3\u6784\u4E0D\u5339\u914D\uFF1A\u7ED1\u5B9A\u8282\u70B9\u4E0D\u80FD\u76F8\u4E92\u5D4C\u5957");
      if (["fourier@1", "table@1"].includes(b.recipe)) {
        validateLegacyBehaviors({ ...s, behaviors: [b] });
        continue;
      }
      if (!exact(b.state, adapter.state)) throw Error("\u72B6\u6001\u5B57\u6BB5\u4E0D\u5408\u6CD5");
      for (const key of adapter.arrays) if (!Array.isArray(b.bindings[key]) || b.bindings[key].length < 2 || b.bindings[key].length > 12) throw Error("\u6570\u7EC4\u7ED1\u5B9A\u6570\u91CF\u4E0D\u5408\u6CD5");
      const refs = Object.fromEntries(Object.entries(b.bindings).map(([k, v]) => [k, Array.isArray(v) ? v.map((p) => map.get(p)) : map.get(v)]));
      const html = (n) => n?.ns === "html", plain = (n) => n.children.every((c) => Object.hasOwn(c, "text"));
      if (!html(refs.root) || !["div", "section", "article"].includes(refs.root.tag)) throw Error("\u7EC4\u4EF6\u6839\u7ED3\u6784\u4E0D\u5339\u914D");
      const parent = (p) => p.slice(0, p.lastIndexOf(".")), wrappers = /* @__PURE__ */ new Set(["main", "div", "section", "article", "aside", "header", "figure", "label", "ul", "ol", "li", "details"]);
      for (const path of paths) for (let p = parent(path); p; p = parent(p)) {
        const n = map.get(p);
        if (!html(n) || !wrappers.has(n.tag) && !b.bindings.panels?.includes(p)) throw Error("\u7EC4\u4EF6\u7956\u5148\u7ED3\u6784\u4E0D\u5339\u914D");
      }
      const panelTopology = (n) => {
        if (n.text !== void 0) return;
        const blocks = /* @__PURE__ */ new Set(["div", "section", "article", "main", "aside", "header", "figure", "p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "table", "details"]);
        if (n.ns === "html" && ["p", "span", "strong", "em", "code", "output", "button", "label", "h1", "h2", "h3", "h4", "h5", "h6"].includes(n.tag)) {
          for (const [, c] of nodes(n)) if (c !== n && c.ns === "html" && (blocks.has(c.tag) || n.tag === "button" && ["button", "input", "details"].includes(c.tag))) throw Error("\u9762\u677F\u540E\u4EE3\u7ED3\u6784\u4F1A\u88AB HTML \u89E3\u6790\u5668\u6539\u5199");
        }
        const tableChildren = { table: ["caption", "colgroup", "thead", "tbody", "tfoot"], thead: ["tr"], tbody: ["tr"], tfoot: ["tr"], tr: ["td", "th"], colgroup: ["col"] };
        if (tableChildren[n.tag] && n.children.some((c) => c.text !== void 0 ? c.text.trim() : !tableChildren[n.tag].includes(c.tag))) throw Error("\u9762\u677F\u8868\u683C\u7ED3\u6784\u4E0D\u7A33\u5B9A");
        n.children.forEach(panelTopology);
      };
      const visible = (n, on) => {
        panelTopology(n);
        if (!html(n) || !["div", "section", "article"].includes(n.tag) || Object.hasOwn(n.attrs, "hidden") === on || n.attrs["aria-hidden"] !== String(!on)) throw Error("\u9762\u677F\u53EF\u89C1\u72B6\u6001\u4E0D\u5339\u914D");
      };
      const local = (n, key, target) => {
        if (n.attrs[key] !== void 0 && (!/^uip-\d+$/.test(n.attrs[key]) || n.attrs[key] !== target.attrs.id)) throw Error("ARIA \u5F15\u7528\u4E0D\u5339\u914D");
      };
      if (b.recipe === "calculator@1") {
        const result = sumValue(b.state.left, b.state.right);
        for (const key of ["left", "right"]) {
          const n = refs[key];
          if (!html(n) || n.tag !== "input" || n.attrs.type !== "number" || n.attrs.disabled !== "" || Number(n.attrs.min) !== -100 || Number(n.attrs.max) !== 100 || Number(n.attrs.step) !== 0.01 || n.attrs.value.trim() === "" || Number(n.attrs.value) !== b.state[key]) throw Error("\u8BA1\u7B97\u8F93\u5165\u6A21\u578B\u4E0D\u5339\u914D");
        }
        if (!html(refs.output) || refs.output.tag !== "output" || !plain(refs.output) || text(refs.output) !== result) throw Error("\u8BA1\u7B97\u8F93\u51FA\u4E0D\u5339\u914D");
      } else if (b.recipe === "tabs@1") {
        if (refs.tabs.length !== refs.panels.length || !Number.isInteger(b.state.active) || b.state.active < 0 || b.state.active >= refs.tabs.length) throw Error("Tabs \u72B6\u6001\u4E0D\u5408\u6CD5");
        refs.tabs.forEach((n, i) => {
          const on = i === b.state.active, p = refs.panels[i];
          if (!html(n) || n.tag !== "button" || !plain(n) || n.attrs.role !== "tab" || n.attrs["aria-selected"] !== String(on) || n.attrs.tabindex !== (on ? "0" : "-1") || p.attrs.role !== "tabpanel") throw Error("Tabs \u7ED3\u6784\u6216\u72B6\u6001\u4E0D\u5339\u914D");
          visible(p, on);
          local(n, "aria-controls", p);
          local(p, "aria-labelledby", n);
        });
      } else {
        if (typeof b.state.active !== "boolean" || refs.panels.length !== 2 || !html(refs.control) || refs.control.tag !== "input" || refs.control.attrs.type !== "checkbox" || Object.hasOwn(refs.control.attrs, "checked") !== b.state.active) throw Error("\u5E03\u5C14\u72B6\u6001\u6A21\u578B\u4E0D\u5339\u914D");
        refs.panels.forEach((n, i) => visible(n, i === Number(b.state.active)));
      }
    }
    for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
      const a = bs[i], b = bs[j], ar = a.bindings.root, br = b.bindings.root;
      if (ar === br || bindingPaths(a.bindings).some((p) => bindingPaths(b.bindings).includes(p))) throw Error("\u7EC4\u4EF6\u7ED1\u5B9A\u8303\u56F4\u91CD\u53E0");
      const check = (outer, inner) => {
        if (!inner.bindings.root.startsWith(outer.bindings.root + ".")) return;
        const panels = outer.bindings.panels || [];
        if (!panels.some((p) => inner.bindings.root.startsWith(p + "."))) throw Error("\u5D4C\u5957\u7EC4\u4EF6\u5FC5\u987B\u4F4D\u4E8E\u72EC\u7ACB\u9762\u677F");
        for (const p of bindingPaths(outer.bindings)) if (p.startsWith(inner.bindings.root + ".")) throw Error("\u4EA4\u53C9\u7EC4\u4EF6\u7ED1\u5B9A");
      };
      check(a, b);
      check(b, a);
    }
    return bs;
  }
  function analyze(s, strategy = "auto", { confirmDegradation = false } = {}) {
    if (!["auto", "interactive", "static"].includes(strategy)) throw Error("\u5BFC\u51FA\u7B56\u7565\u4E0D\u5408\u6CD5");
    validateBehaviors(s);
    const map = nodes(s.tree), components = [], covered = /* @__PURE__ */ new Set();
    for (const b of s.behaviors || []) {
      bindingPaths(b.bindings).forEach((p) => covered.add(p));
      const tested = b.evidence === "fixture-equivalence-v1" && s.provenance?.status === "captured";
      components.push({ path: b.bindings.root, recipe: b.recipe, capability: strategy === "static" ? "static-fallback" : tested ? "reconstructed-tested" : "model-validated", evidence: tested ? "owned fixture / finite model / equivalence-v1" : "finite model validated locally; source equivalence unverified" });
    }
    const nativeStable = (path) => {
      for (let p = path; p; p = p.slice(0, p.lastIndexOf("."))) {
        const n = map.get(p);
        if (n?.ns !== "html" || !["main", "section", "div", "article", "aside", "header", "figure", "figcaption", "blockquote", "details", "ul", "ol", "li", "dl", "dt", "dd"].includes(n.tag)) return false;
      }
      return true;
    };
    for (const [path, n] of map) {
      if (n.tag === "details") {
        const stable = nativeStable(path);
        components.push({ path, recipe: "native-details@1", capability: strategy === "static" || !stable ? "static-fallback" : "native-preserved", evidence: stable ? "browser details/summary; no source script" : "parser-stable HTML ancestry not verified", ...!stable ? { reason: "\u6298\u53E0\u7ED3\u6784\u65E0\u6CD5\u786E\u8BA4\uFF0C\u9759\u6001\u964D\u7EA7" } : {} });
      } else if (["input", "button"].includes(n.tag) && !covered.has(path)) components.push({ path, capability: "static-fallback", reason: "\u672A\u77E5\u884C\u4E3A\uFF0C\u672A\u6062\u590D\u6765\u6E90\u4E8B\u4EF6\u6216\u8BA1\u7B97\u903B\u8F91" });
    }
    const active = components.filter((c) => c.capability !== "static-fallback").length, unsupported = components.filter((c) => c.capability === "static-fallback").length;
    const requiresConfirmation = strategy === "interactive" && active > 0 && unsupported > 0, degradationConfirmed = requiresConfirmation && confirmDegradation === true;
    const blockedReason = strategy === "interactive" && !active ? "\u6CA1\u6709\u53EF\u6062\u590D\u4EA4\u4E92\uFF0C\u8BF7\u9009\u62E9 Auto \u6216 Static" : requiresConfirmation && !degradationConfirmed ? "\u5B58\u5728\u4E0D\u53EF\u6062\u590D\u7EC4\u4EF6\uFF0C\u8BF7\u663E\u5F0F\u786E\u8BA4\u9759\u6001\u964D\u7EA7" : "";
    return { strategy, capability: active ? unsupported ? "partial-interactive" : "selective-interactive" : s.capability || "static", components, recoverable: active, staticComponents: unsupported, requiresConfirmation, degradationConfirmed, exportable: !blockedReason, blockedReason, limitations: ["\u4EC5\u6709\u5217\u51FA\u7684\u539F\u751F/\u53D7\u63A7 recipe \u53EF\u4EA4\u4E92\uFF1B\u5176\u4F59\u4E3A\u9759\u6001\u5916\u89C2", "\u6A21\u578B\u6821\u9A8C\u4E0D\u7B49\u4E8E\u6765\u6E90\u884C\u4E3A\u7B49\u4EF7\u8BC1\u660E\uFF1B\u4E0D\u662F\u539F\u59CB\u7A0B\u5E8F\u6216\u54CD\u5E94\u5F0F\u89C4\u5219\u7684\u65E0\u635F\u590D\u5236"] };
  }

  // extension/src/capture/adapters.js
  function detectCandidates(selected, contract) {
    if (!contract.finiteModels) return [];
    return [selected, ...selected.querySelectorAll("[data-uip-recipe]")].filter((root) => root.hasAttribute("data-uip-recipe")).map((root) => ({ root, recipe: root.getAttribute("data-uip-recipe") }));
  }
  function componentRoles(root) {
    const roles = /* @__PURE__ */ new Map();
    for (const el of root.querySelectorAll("[data-uip-role]")) if (el.closest("[data-uip-recipe]") === root) {
      const key = el.getAttribute("data-uip-role");
      roles.set(key, [...roles.get(key) || [], el]);
    }
    return roles;
  }
  function extractCandidate({ root, recipe }, captured, paths, evidence) {
    const adapter = getAdapter(recipe);
    if (!adapter) throw Error("\u672A\u77E5\u6216\u4E0D\u517C\u5BB9\u7684\u9002\u914D\u5668\uFF1A" + recipe);
    const roles = componentRoles(root), bindings = { root: paths.get(captured.get(root)) };
    const arrayRole = Object.fromEntries(Object.entries(adapter.arrayRoles).map(([binding, role]) => [role, binding]));
    for (const [role, elements] of roles) {
      if (arrayRole[role]) bindings[arrayRole[role]] = elements.map((el) => paths.get(captured.get(el)));
      else {
        if (elements.length !== 1) throw Error("\u91CD\u590D\u7EC4\u4EF6\u7ED1\u5B9A\uFF1A" + role);
        bindings[role] = paths.get(captured.get(elements[0]));
      }
    }
    const value = (k) => {
      const el = roles.get(k)?.[0];
      if (!el) throw Error("\u7F3A\u5931\u7ED1\u5B9A\uFF1A" + k);
      return Number(el.value);
    };
    let state;
    if (recipe === "fourier@1") state = { harmonics: value("harmonics"), amplitude: value("amplitude"), phase: value("phase") };
    else if (recipe === "table@1") state = { minimum: value("filter"), direction: root.dataset.direction || "asc" };
    else if (recipe === "tabs@1") state = { active: (roles.get("tab") || []).findIndex((el) => el.getAttribute("aria-selected") === "true") };
    else if (recipe === "calculator@1") state = { left: value("left"), right: value("right") };
    else if (recipe === "state@1") state = { active: roles.get("control")?.[0]?.checked === true };
    return { recipe, bindings, state, evidence };
  }
  function prevalidateCandidate(candidate, evidence) {
    const { root, recipe } = candidate, adapter = getAdapter(recipe);
    if (!adapter || adapter.native) throw Error("\u672A\u77E5\u6216\u4E0D\u517C\u5BB9\u7684\u9002\u914D\u5668\uFF1A" + recipe);
    const roles = componentRoles(root), defaults = recipe === "fourier@1" ? { harmonics: 1, amplitude: 1, phase: 0 } : recipe === "table@1" ? { minimum: 0, direction: "asc" } : recipe === "calculator@1" ? { left: 0, right: 0 } : recipe === "tabs@1" ? { active: 0 } : { active: false };
    const identity = /* @__PURE__ */ new Map();
    let serial = 0;
    for (const el of [root, ...root.querySelectorAll("[id]")]) if (el.id) {
      if (identity.has(el.id)) identity.set(el.id, null);
      else identity.set(el.id, "uip-" + serial++);
    }
    function representation(state, readText) {
      const captured = /* @__PURE__ */ new WeakMap();
      function walk(el, modelText = false) {
        if (el.nodeType === 3) return { text: readText && modelText ? el.nodeValue || "" : "" };
        if (el.nodeType !== 1) return null;
        const n = { tag: el.localName, ns: el.namespaceURI === "http://www.w3.org/2000/svg" ? "svg" : "html", attrs: {}, children: [], style: {} };
        captured.set(el, n);
        for (const k of ["type", "min", "max", "step", "role", "aria-selected", "aria-hidden", "tabindex", "d"]) if (el.hasAttribute(k)) n.attrs[k] = el.getAttribute(k);
        if (el.id && identity.get(el.id)) n.attrs.id = identity.get(el.id);
        for (const k of ["aria-controls", "aria-labelledby"]) if (el.hasAttribute(k)) n.attrs[k] = identity.get(el.getAttribute(k)) || "invalid-reference";
        if (el.hidden) n.attrs.hidden = "";
        if (el.localName === "input") {
          n.attrs.disabled = "";
          if (el.type === "checkbox") {
            if (el.checked) n.attrs.checked = "";
          } else {
            const role2 = el.getAttribute("data-uip-role"), key = role2 === "filter" ? "minimum" : role2;
            n.attrs.value = String(state[key] ?? 0);
          }
        }
        const role = el.getAttribute("data-uip-role");
        const requiredText = recipe === "calculator@1" && role === "output" || recipe === "table@1" && el.localName === "td";
        if (readText && recipe === "calculator@1" && role === "output") for (let p = el; p; p = p.parentElement) {
          if (p.hidden || getComputedStyle(p).display === "none" || ["hidden", "collapse"].includes(getComputedStyle(p).visibility)) throw Error("\u8BA1\u7B97\u8F93\u51FA\u5FC5\u987B\u53EF\u89C1");
          if (p === root) break;
        }
        n.children = [...el.childNodes].map((child) => walk(child, modelText || requiredText)).filter(Boolean);
        if (!readText && recipe === "fourier@1" && role === "curve") n.attrs.d = fourierPath(state);
        if (!readText && recipe === "calculator@1" && role === "output") n.children = [{ text: String(Number((state.left + state.right).toFixed(2))) }];
        if (!readText && recipe === "table@1" && el.localName === "td") n.children = [{ text: el.cellIndex === 1 ? "0" : "row" }];
        return n;
      }
      const tree = walk(root), paths = new Map([...nodes(tree)].map(([p, n]) => [n, p]));
      const bindings = { root: "0" }, arrayRole = Object.fromEntries(Object.entries(adapter.arrayRoles).map(([binding, role]) => [role, binding]));
      for (const [role, elements] of roles) {
        if (arrayRole[role]) bindings[arrayRole[role]] = elements.map((el) => paths.get(captured.get(el)));
        else {
          if (elements.length !== 1) throw Error("\u91CD\u590D\u7EC4\u4EF6\u7ED1\u5B9A\uFF1A" + role);
          bindings[role] = paths.get(captured.get(elements[0]));
        }
      }
      validateBehaviors({ tree, behaviors: [{ recipe, bindings, state, evidence }] });
    }
    if (recipe === "tabs@1") defaults.active = (roles.get("tab") || []).findIndex((el) => el.getAttribute("aria-selected") === "true");
    if (recipe === "state@1") defaults.active = roles.get("control")?.[0]?.checked === true;
    representation(defaults, false);
    const fakeCapture = /* @__PURE__ */ new WeakMap(), fakePaths = /* @__PURE__ */ new Map();
    let i = 0;
    for (const el of [root, ...root.querySelectorAll("*")]) {
      const n = {};
      fakeCapture.set(el, n);
      fakePaths.set(n, String(i++));
    }
    const behavior = extractCandidate(candidate, fakeCapture, fakePaths, evidence);
    representation(behavior.state, false);
    representation(behavior.state, true);
    return candidate;
  }

  // extension/src/core/policy.js
  var allowedHtml = new Set("a article aside blockquote br button caption code dd details div dl dt em figcaption figure h1 h2 h3 h4 h5 h6 header hr i kbd label li main mark ol p pre q s samp section small span strong sub summary sup output table tbody td th thead tfoot time tr u ul".split(" "));
  var allowedSvg = new Set("svg g defs path rect circle ellipse line polyline polygon text tspan lineargradient radialgradient stop clippath mask pattern title desc".split(" "));
  var allowedAttributes = new Set("role aria-selected aria-hidden aria-controls aria-labelledby tabindex hidden viewBox width height x y x1 x2 y1 y2 cx cy r rx ry d points transform fill stroke stroke-width stroke-linecap stroke-linejoin opacity fill-opacity stroke-opacity offset stop-color stop-opacity preserveAspectRatio xmlns vector-effect clip-path mask stroke-dasharray stroke-dashoffset text-anchor dominant-baseline colspan rowspan start value display".split(" "));
  var styleProps = ["visibility", "direction", "writing-mode", "color-scheme", "background-image", "background-size", "background-position", "background-repeat", "border-collapse", "border-spacing", "table-layout", "caption-side", "list-style-type", "list-style-position", "font-variant", "font-stretch", "word-break", "overflow-wrap", "text-indent", "text-transform", "text-overflow", "text-shadow", "float", "clear", "align-self", "align-content", "justify-items", "justify-self", "column-gap", "row-gap", "grid-auto-flow", "grid-auto-rows", "grid-auto-columns", "flex-grow", "flex-shrink", "flex-basis", "order", "aspect-ratio", "max-height", "object-position", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "fill-opacity", "stroke-opacity", "stop-color", "stop-opacity", "text-anchor", "dominant-baseline", "clip-path", "mask", "transform", "transform-origin", "display", "position", "top", "right", "bottom", "left", "z-index", "box-sizing", "color", "background-color", "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "text-align", "white-space", "width", "height", "max-width", "min-width", "min-height", "margin", "margin-top", "margin-right", "margin-bottom", "margin-left", "padding", "padding-top", "padding-right", "padding-bottom", "padding-left", "border", "border-width", "border-style", "border-color", "border-radius", "box-shadow", "opacity", "vertical-align", "flex", "flex-direction", "flex-wrap", "align-items", "justify-content", "gap", "grid-template-columns", "grid-template-rows", "grid-column", "grid-row", "overflow", "text-decoration", "object-fit"];
  styleProps.push(...["top", "right", "bottom", "left"].flatMap((side) => ["width", "style", "color"].map((part) => "border-" + side + "-" + part)), ...["top-left", "top-right", "bottom-right", "bottom-left"].map((corner) => "border-" + corner + "-radius"), "overflow-x", "overflow-y", "column-count", "column-width", "column-fill", "column-rule-width", "column-rule-style", "column-rule-color", "break-inside", "text-decoration-line", "text-decoration-color", "text-decoration-style", "text-decoration-thickness");
  var rejectTags = new Set("script style iframe frame object embed template link meta base audio video source track noscript foreignobject animate animatetransform set use".split(" "));
  var allowedMath = new Set("math mrow mi mn mo mtext mfrac msqrt mroot msup msub msubsup munder mover munderover mtable mtr mtd mfenced mspace menclose mstyle mpadded".split(" "));
  var SVG = "http://www.w3.org/2000/svg";
  var MATH = "http://www.w3.org/1998/Math/MathML";
  var safeFunctions = new Set("rgb rgba hsl hsla hwb lab lch oklab oklch color color-mix light-dark linear-gradient repeating-linear-gradient radial-gradient repeating-radial-gradient conic-gradient repeating-conic-gradient matrix matrix3d translate translatex translatey translatez translate3d scale scalex scaley scalez scale3d rotate rotatex rotatey rotatez rotate3d skew skewx skewy perspective calc min max clamp var env fit-content repeat minmax".split(" "));
  function safeCss(v) {
    if (typeof v !== "string" || v.includes("/*") || /[;{}!]|[\x00-\x1f\x7f]/.test(v)) return false;
    for (const m of v.matchAll(/([a-z-][a-z0-9-]*)\s*\(/gi)) if (!safeFunctions.has(m[1].toLowerCase())) return false;
    return typeof v === "string" && v.length < 2e3 && !/[<>\\]|url\s*\(|expression\s*\(|@|javascript:|data:|[\x00-\x08]/i.test(v);
  }
  function localReference(v) {
    return /^url\(["\']?#uip-[0-9]+["\']?\)$/.test(v);
  }

  // extension/src/core/ir.js
  var VERSION = "1.4.0";
  var LIMITS = Object.freeze({ nodes: 5e3, depth: 75, text: 1e6, bytes: 4e6, dimension: 12e3, resource: 2e6 });
  var own = (o, keys) => {
    if (!o || typeof o !== "object" || Array.isArray(o) || Object.keys(o).some((k) => !keys.includes(k))) throw Error("IR \u5B57\u6BB5\u4E0D\u5408\u6CD5");
  };
  var str = (s, max = 2e3) => {
    if (typeof s !== "string" || s.length > max) throw Error("IR \u5B57\u7B26\u4E32\u8D85\u9650");
  };
  var list = (v, max = 200) => {
    if (!Array.isArray(v) || v.length > max) throw Error("IR \u6570\u7EC4\u8D85\u9650");
  };
  var bytes = (v) => new TextEncoder().encode(typeof v === "string" ? v : JSON.stringify(v)).length;
  async function sha256(data) {
    const buf = typeof data === "string" ? new TextEncoder().encode(data) : data;
    return [...new Uint8Array(await crypto.subtle.digest("SHA-256", buf))].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  function validateSnapshot(s) {
    own(s, ["schemaVersion", "kind", "capability", "createdAt", "source", "dimensions", "background", "tree", "resources", "provenance", "omissions", "limitations", "security", "stats", "behaviors"]);
    if (![VERSION, "1.0.0", "1.1.0", "1.2.0", "1.3.0"].includes(s.schemaVersion)) throw Error("\u4E0D\u652F\u6301\u7684 schemaVersion\uFF1B\u8BF7\u8FC1\u79FB\u6216\u4F7F\u7528\u539F\u7248\u672C");
    if (s.kind !== "ui-portability-snapshot" || !["static", "visual-only"].includes(s.capability)) throw Error("\u672A\u7ECF\u6D4B\u8BD5\u7684\u80FD\u529B\u7B49\u7EA7");
    str(s.createdAt, 30);
    if (!Number.isFinite(Date.parse(s.createdAt))) throw Error("\u521B\u5EFA\u65F6\u95F4\u4E0D\u5408\u6CD5");
    own(s.source, ["type", "origin"]);
    if (!["page", "html", "svg", "json", "image"].includes(s.source.type)) throw Error("\u6765\u6E90\u7C7B\u578B\u4E0D\u5408\u6CD5");
    str(s.source.origin, 300);
    if (s.source.origin !== "local") {
      const u = new URL(s.source.origin);
      if (!/^https?:$/.test(u.protocol) || u.origin !== s.source.origin || /chatgpt\.com$|chat\.openai\.com$/.test(u.hostname)) throw Error("\u6765\u6E90\u672A\u8131\u654F\u6216\u88AB\u7981\u7528");
    }
    own(s.dimensions, ["width", "height"]);
    for (const n of [s.dimensions.width, s.dimensions.height]) if (!Number.isFinite(n) || n < 1 || n > LIMITS.dimension) throw Error("\u5C3A\u5BF8\u8D85\u9650");
    if (!safeCss(s.background) || !/^(#[0-9a-f]{3,8}|rgba?\([0-9.,% /]+\)|transparent)$/i.test(s.background)) throw Error("\u80CC\u666F\u4E0D\u5408\u6CD5");
    own(s.provenance, ["method", "status"]);
    if (!["sanitized-dom", "local-file", "raster-import", "migrated-v02"].includes(s.provenance.method) || !["captured", "external-unverified"].includes(s.provenance.status)) throw Error("\u6765\u6E90\u65B9\u6CD5\u4E0D\u5408\u6CD5");
    own(s.security, ["redacted", "remoteResources", "scripts"]);
    if (typeof s.security.redacted !== "boolean" || s.security.redacted === false && s.provenance.status !== "external-unverified" || s.security.remoteResources !== false || s.security.scripts !== false) throw Error("\u5B89\u5168\u5951\u7EA6\u4E0D\u5408\u6CD5");
    for (const k of ["omissions", "limitations"]) {
      list(s[k]);
      s[k].forEach((x) => str(x, 1e3));
    }
    if (s.stats) {
      own(s.stats, ["elements", "omittedImages", "canvasImages", "omittedFrames", "redactedControls", "externalLinks", "truncated", "svg"]);
      for (const v of Object.values(s.stats)) if (typeof v !== "boolean" && (!Number.isInteger(v) || v < 0 || v > 1e4)) throw Error("\u7EDF\u8BA1\u4E0D\u5408\u6CD5");
    }
    list(s.resources, 100);
    const ids = /* @__PURE__ */ new Set();
    for (const r of s.resources) {
      own(r, ["id", "mime", "data", "sha256", "status"]);
      if (!/^r[0-9]+$/.test(r.id) || ids.has(r.id)) throw Error("\u8D44\u6E90 ID \u91CD\u590D\u6216\u975E\u6CD5");
      ids.add(r.id);
      if (!["image/png", "image/jpeg", "image/webp"].includes(r.mime) || r.status !== "captured" || !/^[a-f0-9]{64}$/.test(r.sha256) || typeof r.data !== "string" || r.data.length > LIMITS.resource || !/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(r.data)) throw Error("\u8D44\u6E90\u4E0D\u5408\u6CD5");
    }
    let count = 0, text2 = 0;
    function walk(n, depth) {
      if (++count > LIMITS.nodes || depth > LIMITS.depth) throw Error("IR \u8D85\u8FC7 5000 \u8282\u70B9\u6216 75 \u5C42");
      if (n && Object.hasOwn(n, "text")) {
        own(n, ["text"]);
        str(n.text, LIMITS.text);
        text2 += n.text.length;
        if (text2 > LIMITS.text) throw Error("\u6587\u672C\u8D85\u9650");
        return;
      }
      own(n, ["tag", "ns", "attrs", "style", "children", "component", "state", "resourceId", "evidence"]);
      str(n.tag, 30);
      if (!(n.ns === "html" && (allowedHtml.has(n.tag) || ["input", "img"].includes(n.tag)) || n.ns === "svg" && allowedSvg.has(n.tag.toLowerCase()) || n.ns === "math" && allowedMath.has(n.tag))) throw Error("\u6807\u7B7E\u4E0D\u5408\u6CD5");
      if (n.evidence) {
        own(n.evidence, ["status", "method"]);
        if (!["captured", "unsupported"].includes(n.evidence.status) || !["computed-dom", "rasterized", "redacted", "placeholder", "flattened-shadow", "generated-pseudo", "scroll-flattened"].includes(n.evidence.method)) throw Error("\u8282\u70B9\u6765\u6E90\u4E0D\u5408\u6CD5");
      }
      if (n.component && !["container", "table", "graphic", "formula", "control", "image"].includes(n.component)) throw Error("\u7EC4\u4EF6\u7C7B\u578B\u4E0D\u5408\u6CD5");
      own(n.attrs, [...allowedAttributes, "id", "open", "disabled", "type", "checked", "min", "max", "step", "value", "alt", "gradientUnits", "gradientTransform", "clipPathUnits", "maskUnits", "patternUnits"]);
      if (s.schemaVersion !== "1.4.0" && ["start", "display"].some((k) => Object.hasOwn(n.attrs, k))) throw Error("IR 1.4 \u5C5E\u6027\u9700\u8981\u663E\u5F0F\u7248\u672C\u5347\u7EA7");
      for (const [k, v] of Object.entries(n.attrs)) {
        str(v, ["d", "points"].includes(k) ? 1e5 : 1e3);
        if (/[<>]|javascript:|data:|[\x00-\x08]/i.test(v) || /url\s*\(/i.test(v) && !localReference(v)) throw Error("\u6D3B\u52A8\u5C5E\u6027\u4E0D\u5408\u6CD5");
        if (!["d", "points"].includes(k) && !safeCss(v) && !localReference(v)) throw Error("\u5C5E\u6027\u8D44\u6E90\u8BED\u6CD5\u4E0D\u5408\u6CD5");
        if (k === "id" && !/^uip-\d+$/.test(v)) throw Error("ID \u4E0D\u5408\u6CD5");
      }
      for (const k of ["aria-controls", "aria-labelledby"]) if (n.attrs[k] !== void 0 && !/^uip-\d+$/.test(n.attrs[k])) throw Error("ARIA \u5F15\u7528\u5FC5\u987B\u4E3A\u672C\u5730 ID");
      if (n.attrs.role !== void 0 && !["tab", "tabpanel", "tablist"].includes(n.attrs.role) || n.attrs.tabindex !== void 0 && !["0", "-1"].includes(n.attrs.tabindex) || ["aria-selected", "aria-hidden"].some((k) => n.attrs[k] !== void 0 && !["true", "false"].includes(n.attrs[k])) || n.attrs.hidden !== void 0 && n.attrs.hidden !== "") throw Error("\u53EF\u8BBF\u95EE\u72B6\u6001\u4E0D\u5408\u6CD5");
      if (n.tag === "input" && n.attrs.type === "number" && (!["min", "max", "step", "value"].every((k) => typeof n.attrs[k] === "string" && n.attrs[k].trim() !== "" && Number.isFinite(Number(n.attrs[k]))) || Number(n.attrs.min) !== -100 || Number(n.attrs.max) !== 100 || Number(n.attrs.step) !== 0.01 || Number(n.attrs.value) < -100 || Number(n.attrs.value) > 100)) throw Error("\u6570\u5B57\u63A7\u4EF6\u9759\u6001\u6570\u503C\u4E0D\u5408\u6CD5");
      if (n.tag === "input" && (!["range", "checkbox", "radio", "number"].includes(n.attrs.type) || n.attrs.disabled !== "") || n.tag === "button" && n.attrs.disabled !== "") throw Error("\u63A7\u4EF6\u5FC5\u987B\u9759\u6001\u7981\u7528");
      own(n.style, styleProps);
      for (const v of Object.values(n.style)) if (!safeCss(v) && !localReference(v)) throw Error("\u6D3B\u52A8\u6837\u5F0F\u4E0D\u5408\u6CD5");
      if (n.state) {
        own(n.state, ["scrollTop", "scrollLeft"]);
        for (const v of Object.values(n.state)) if (!Number.isFinite(v) || v < 0 || v > 1e6) throw Error("\u72B6\u6001\u4E0D\u5408\u6CD5");
      }
      if (n.resourceId && (!ids.has(n.resourceId) || n.tag !== "img")) throw Error("\u8D44\u6E90\u4E0D\u5B58\u5728");
      list(n.children, LIMITS.nodes);
      if (n.ns === "html" && ["input", "img", "br", "hr"].includes(n.tag) && n.children.length) throw Error("HTML \u7A7A\u5143\u7D20\u4E0D\u80FD\u5305\u542B\u5B50\u8282\u70B9");
      n.children.forEach((c) => walk(c, depth + 1));
    }
    walk(s.tree, 0);
    if (!["1.3.0", VERSION].includes(s.schemaVersion) && s.behaviors?.some((b) => !["fourier@1", "table@1"].includes(b.recipe))) throw Error("\u65E7\u7248\u4E0D\u652F\u6301\u65B0\u9002\u914D\u5668");
    if (s.schemaVersion === "1.1.0" && s.behaviors?.some((b) => b.evidence !== "fixture-equivalence-v1")) throw Error("IR 1.1 \u4E0D\u652F\u6301\u6A21\u578B\u6821\u9A8C\u6807\u8BB0");
    if (s.schemaVersion === "1.0.0" && s.behaviors) throw Error("\u65E7\u7248\u4E0D\u5141\u8BB8\u4EA4\u4E92");
    validateBehaviors(s);
    if (bytes(s) > LIMITS.bytes) throw Error("\u5FEB\u7167\u8D85\u8FC7 4 MB");
    return s;
  }
  var diagnostic = (s) => {
    validateSnapshot(s);
    return { kind: "ui-portability-diagnostic", schemaVersion: VERSION, capability: s.capability, createdAt: s.createdAt, dimensions: s.dimensions, omissions: s.omissions, limitations: s.limitations, security: s.security, typography: typography(s.tree), resourceSummary: s.resources.map(({ id, mime, sha256: sha2562, status }) => ({ id, mime, sha256: sha2562, status })) };
  };
  function typography(tree) {
    const fonts = /* @__PURE__ */ new Set(), math = { block: 0, inline: 0 };
    let svg2 = 0, mergedTables = 0;
    function visit(n) {
      if (n.style?.["font-family"]) fonts.add(n.style["font-family"]);
      if (n.tag === "math") math[n.attrs.display === "block" ? "block" : "inline"]++;
      if (n.tag === "svg") svg2++;
      if (["td", "th"].includes(n.tag) && (Number(n.attrs.colspan || 1) > 1 || Number(n.attrs.rowspan || 1) > 1)) mergedTables++;
      n.children?.forEach(visit);
    }
    visit(tree);
    return { sourceFontFamilies: [...fonts], math, svg: svg2, mergedCells: mergedTables, glyphCoverage: "unverified", fontFiles: "not-embedded", markdown: "MathML / SVG \u5728 Markdown \u4E2D\u4F7F\u7528 HTML \u5BFC\u51FA\u5360\u4F4D\uFF1B\u5408\u5E76\u5355\u5143\u683C\u56DE\u9000\u4E3A\u5B89\u5168 HTML\uFF0C\u9605\u8BFB\u5668\u652F\u6301\u53EF\u80FD\u4E0D\u540C\u3002", guidance: "\u8BF7\u5BF9\u7167\u6765\u6E90\u4E0E\u79BB\u7EBF HTML \u7684\u540C\u4E00\u516C\u5F0F\u3002\u82E5\u4E24\u8005\u5747\u7F3A\u5B57\uFF0C\u5148\u68C0\u67E5\u6765\u6E90\u5B57\u4F53\uFF1B\u53EA\u6709\u5BFC\u51FA\u7F3A\u5B57\u65F6\u68C0\u67E5\u79BB\u7EBF\u7CFB\u7EDF\u56DE\u9000\u5B57\u4F53\u3002\u672C\u62A5\u544A\u5217\u51FA\u58F0\u660E\u7684\u5B57\u4F53\u65CF\uFF0C\u4E0D\u8BC1\u660E\u5B57\u5F62\u8986\u76D6\uFF0C\u4E5F\u4E0D\u63A8\u65AD LaTeX\u3002" };
  }

  // extension/src/capture/dom.js
  async function captureElement(selected, { signal, exclude, onProgress = () => {
  }, source = { type: "page", origin: location.origin }, method = "sanitized-dom", controlled = false } = {}) {
    if (!selected?.isConnected) throw Error("\u6240\u9009\u533A\u57DF\u5DF2\u88AB\u9875\u9762\u79FB\u9664");
    const rect = selected.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1 || rect.width > 12e3 || rect.height > 12e3) throw Error("\u533A\u57DF\u5C3A\u5BF8\u987B\u5728 1\u201312000 px \u4E4B\u95F4");
    const captured = /* @__PURE__ */ new WeakMap();
    const contract = sourceAdapter(location.href, { controlled, file: method !== "sanitized-dom" });
    const originallyHidden = /* @__PURE__ */ new Set(), controlledPanels = /* @__PURE__ */ new Set();
    let visited = 0, textSize = 0, resourceSize = 0;
    const resources = [], ids = /* @__PURE__ */ new Map(), ambiguousIDs = /* @__PURE__ */ new Set();
    const stats = { elements: 0, omittedImages: 0, canvasImages: 0, omittedFrames: 0, redactedControls: 0, externalLinks: 0, truncated: false, svg: 0 };
    const omissions = /* @__PURE__ */ new Set(["\u672A\u4FDD\u5B58\u6765\u6E90\u811A\u672C\u548C\u4E8B\u4EF6\uFF1B\u53EF\u6062\u590D\u7684\u539F\u751F\u884C\u4E3A\u4E0E\u81EA\u6709 recipe \u4EE5\u4EA4\u4E92\u62A5\u544A\u4E3A\u51C6", "\u81EA\u5B9A\u4E49\u5B57\u4F53\u6587\u4EF6\u672A\u5D4C\u5165\uFF1B\u79BB\u7EBF\u7AEF\u53EF\u80FD\u4F7F\u7528\u7CFB\u7EDF\u56DE\u9000\u5B57\u4F53", "\u53EA\u6355\u83B7\u5F53\u524D\u5DF2\u6302\u8F7D DOM\uFF1B\u4E0D\u4FDD\u8BC1\u865A\u62DF\u5217\u8868\u3001\u672A\u5C55\u5F00\u6216\u672A\u52A0\u8F7D\u5185\u5BB9\u5B8C\u6574", "\u6B63\u6587\u548C Canvas \u4E2D\u7684\u654F\u611F\u4FE1\u606F\u4E0D\u80FD\u81EA\u52A8\u8BC6\u522B\uFF0C\u8BF7\u4E0B\u8F7D\u524D\u68C0\u67E5"]);
    const scan = [{ node: selected, depth: 0 }];
    let seen = 0;
    while (scan.length) {
      const { node: node2, depth } = scan.pop();
      if (++seen > 5e3 || depth > 75) throw Error("\u6355\u83B7\u8D85\u8FC7 5000 \u8282\u70B9\u6216 75 \u5C42\uFF0C\u8BF7\u7F29\u5C0F\u533A\u57DF");
      if (node2.nodeType === 1 && node2.id) {
        if (ids.has(node2.id)) ambiguousIDs.add(node2.id);
        else ids.set(node2.id, "uip-" + ids.size);
      }
      signal?.throwIfAborted();
      const enqueue = (child) => {
        if (seen + scan.length >= 5e3) throw Error("\u6355\u83B7\u8D85\u8FC7 5000 \u8282\u70B9\u6216 75 \u5C42\uFF0C\u8BF7\u7F29\u5C0F\u533A\u57DF");
        scan.push({ node: child, depth: depth + 1 });
      };
      if (node2.childNodes) for (const child of node2.childNodes) enqueue(child);
      if (node2.shadowRoot) enqueue(node2.shadowRoot);
      if (seen % 64 === 0) {
        await new Promise((r) => setTimeout(r, 0));
        signal?.throwIfAborted();
      }
    }
    for (const id of ambiguousIDs) ids.delete(id);
    if (ambiguousIDs.size) omissions.add("\u91CD\u590D\u6765\u6E90 ID \u7684\u6807\u8BC6\u4E0E\u5F15\u7528\u5DF2\u79FB\u9664\uFF0C\u907F\u514D\u7ED1\u5B9A\u5230\u9519\u8BEF\u8282\u70B9");
    signal?.throwIfAborted();
    const detected = detectCandidates(selected, contract);
    if (detected.length > 20) throw Error("\u7EC4\u4EF6\u5019\u9009\u8D85\u8FC7 20 \u4E2A\uFF0C\u8BF7\u7F29\u5C0F\u533A\u57DF");
    const candidates = [];
    for (const c of detected) {
      try {
        candidates.push(prevalidateCandidate(c, contract.evidence));
      } catch (error) {
        omissions.add(`\u7EC4\u4EF6 ${c.recipe} \u9759\u6001\u964D\u7EA7\uFF08\u9884\u9A8C\u8BC1\uFF09\uFF1A${error.message}`);
      }
    }
    const controlledNumbers = new Set(candidates.filter((c) => c.recipe === "calculator@1").flatMap((c) => [...componentRoles(c.root).get("left") || [], ...componentRoles(c.root).get("right") || []]));
    signal?.throwIfAborted();
    function cssValue(value) {
      if (/url\s*\(/i.test(value)) {
        const match = value.match(/^url\(["']?(?:[^#"')]*#)([^"')]+)["']?\)$/);
        if (match && ids.has(match[1])) return `url(#${ids.get(match[1])})`;
        omissions.add("CSS/SVG \u5916\u90E8\u6216\u7F3A\u5931\u8D44\u6E90\u5F15\u7528\u5DF2\u79FB\u9664");
        return null;
      }
      return safeCss(value) ? value : null;
    }
    function styles(css) {
      const out = {};
      for (const name of styleProps) {
        const v = css.getPropertyValue(name).trim();
        const safe = cssValue(v);
        if (v && safe) out[name] = safe;
      }
      return out;
    }
    async function resource(data, mime) {
      if (data.length > LIMITS.resource || (resourceSize += data.length) > 25e5) throw Error("\u5185\u5D4C\u8D44\u6E90\u8D85\u8FC7\u5B89\u5168\u5927\u5C0F\u9650\u5236");
      const raw = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
      const r = { id: "r" + resources.length, mime, data, sha256: await sha256(raw), status: "captured" };
      resources.push(r);
      return r.id;
    }
    function node(tag = "span", ns = "html") {
      return { tag, ns, attrs: {}, style: {}, children: [], evidence: { status: "captured", method: "computed-dom" } };
    }
    async function clone(original, depth = 0) {
      if (++visited > 5e3 || depth > 75) throw Error("\u6355\u83B7\u8D85\u8FC7 5000 \u8282\u70B9\u6216 75 \u5C42");
      if (visited % 16 === 0) {
        onProgress(visited);
        await new Promise((r) => setTimeout(r, 0));
      }
      signal?.throwIfAborted();
      if (original.nodeType === 3) {
        const text2 = original.nodeValue || "";
        textSize += text2.length;
        if (textSize > 1e6) throw Error("\u6587\u672C\u8D85\u8FC7 100 \u4E07\u5B57\u7B26\u9650\u5236");
        return { text: text2 };
      }
      if (original.nodeType !== 1 || original === exclude) return null;
      const name = original.localName.toLowerCase();
      if (rejectTags.has(name)) {
        if (name === "iframe") stats.omittedFrames++;
        omissions.add("\u4E0D\u652F\u6301\u7684\u6D3B\u52A8\u5185\u5BB9\u5DF2\u79FB\u9664\uFF1A" + name);
        return null;
      }
      const css = getComputedStyle(original);
      if (css.display === "none" && !originallyHidden.has(original) || ["hidden", "collapse"].includes(css.visibility)) return null;
      let target = node();
      captured.set(original, target);
      target.style = styles(css);
      if (originallyHidden.has(original) && target.style.display === "none") delete target.style.display;
      stats.elements++;
      if (controlledPanels.has(original)) {
        try {
          const authored = original.computedStyleMap?.().get("height");
          if (authored?.toString() === "auto") target.style.height = "auto";
          else if (!authored) omissions.add("\u5F53\u524D\u6D4F\u89C8\u5668\u65E0\u6CD5\u786E\u8BA4\u9762\u677F\u81EA\u7136\u9AD8\u5EA6\uFF0C\u4FDD\u7559\u6355\u83B7\u5C3A\u5BF8");
        } catch {
          omissions.add("\u5F53\u524D\u6D4F\u89C8\u5668\u65E0\u6CD5\u786E\u8BA4\u9762\u677F\u81EA\u7136\u9AD8\u5EA6\uFF0C\u4FDD\u7559\u6355\u83B7\u5C3A\u5BF8");
        }
      }
      if (["input", "textarea", "select"].includes(name) || original.isContentEditable) {
        stats.redactedControls++;
        target.evidence = { status: "unsupported", method: "redacted" };
        omissions.add("\u8F93\u5165\u53CA\u53EF\u7F16\u8F91\u5185\u5BB9\u5DF2\u8131\u654F\uFF1B\u672A\u77E5\u63A7\u4EF6\u4EC5\u663E\u793A\u5B89\u5168\u9759\u6001\u72B6\u6001");
        if (name === "input" && (["range", "checkbox", "radio"].includes(original.type) || original.type === "number" && controlledNumbers.has(original))) {
          target.tag = "input";
          target.component = "control";
          target.attrs = { type: original.type, disabled: "" };
          if (["range", "number"].includes(original.type)) for (const k of ["min", "max", "step", "value"]) target.attrs[k] = String(original[k]).slice(0, 30);
          else if (original.checked) target.attrs.checked = "";
        } else target.children = [{ text: "[\u8F93\u5165\u5185\u5BB9\u5DF2\u8131\u654F]" }];
        return target;
      }
      if (name === "canvas") {
        if (original.width * original.height > 1e6 || original.width > 4096 || original.height > 4096) {
          omissions.add("Canvas \u8D85\u8FC7 100 \u4E07\u50CF\u7D20\uFF0C\u5DF2\u7701\u7565");
          return { ...target, children: [{ text: "[Canvas \u8D85\u8FC7\u5B89\u5168\u50CF\u7D20\u9650\u5236]" }] };
        }
        try {
          const blob = await new Promise((resolve) => original.toBlob(resolve, "image/png"));
          signal?.throwIfAborted();
          if (!blob || blob.size > 14e5) throw Error("Canvas too large");
          const data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          target.tag = "img";
          target.evidence = { status: "captured", method: "rasterized" };
          target.resourceId = await resource(data, "image/png");
          stats.canvasImages++;
          omissions.add("Canvas \u5DF2\u8F6C\u4E3A\u9759\u6001 PNG\uFF0C\u4E0D\u542B\u6570\u636E\u548C\u4EA4\u4E92");
          return target;
        } catch (e) {
          if (signal?.aborted) throw e;
          omissions.add("Canvas \u65E0\u6CD5\u8BFB\u53D6\uFF0C\u5DF2\u7701\u7565");
          target.children = [{ text: "[Canvas \u65E0\u6CD5\u5B89\u5168\u5185\u5D4C]" }];
          return target;
        }
      }
      if (name === "img") {
        const src = original.getAttribute("src") || "";
        const m = src.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/i);
        if (m) {
          target.tag = "img";
          target.attrs.alt = (original.getAttribute("alt") || "").slice(0, 1e3);
          target.resourceId = await resource(m[2], m[1].toLowerCase());
        } else {
          stats.omittedImages++;
          omissions.add("\u8FDC\u7A0B\u6216\u975E\u5B89\u5168\u5185\u5D4C\u56FE\u7247\u5DF2\u7701\u7565");
          target.evidence = { status: "unsupported", method: "placeholder" };
          target.children = [{ text: "[\u56FE\u7247\u5DF2\u7701\u7565]" }];
        }
        return target;
      }
      const ns = original.namespaceURI === SVG ? "svg" : original.namespaceURI === MATH ? "math" : "html";
      const supported = ns === "svg" ? allowedSvg.has(name) : ns === "math" ? allowedMath.has(name) : allowedHtml.has(name);
      if (supported) {
        target.tag = ns === "svg" ? original.localName : name;
        target.ns = ns;
      } else {
        target.evidence = { status: "unsupported", method: "placeholder" };
        omissions.add("\u4E0D\u652F\u6301\u7684\u6807\u7B7E\u5DF2\u964D\u4E3A\u6587\u672C\u5BB9\u5668\uFF1A" + name);
      }
      target.component = ns === "svg" ? "graphic" : ns === "math" ? "formula" : name === "table" ? "table" : "container";
      if (name === "svg") stats.svg++;
      if (original.id && ids.has(original.id)) target.attrs.id = ids.get(original.id);
      if (originallyHidden.has(original)) target.attrs.hidden = "";
      const finiteAttributes = { role: ["tab", "tabpanel", "tablist"], "aria-selected": ["true", "false"], "aria-hidden": ["true", "false"], tabindex: ["0", "-1"] };
      for (const [key, allowed] of Object.entries(finiteAttributes)) {
        const value = original.getAttribute(key);
        if (allowed.includes(value)) target.attrs[key] = value;
      }
      for (const key of ["aria-controls", "aria-labelledby"]) {
        const value = original.getAttribute(key);
        if (value && ids.has(value)) target.attrs[key] = ids.get(value);
      }
      for (const attr of original.attributes) {
        if (["role", "aria-selected", "aria-hidden", "tabindex", "hidden", "aria-controls", "aria-labelledby"].includes(attr.name)) continue;
        if (allowedAttributes.has(attr.name) || ["gradientUnits", "gradientTransform", "clipPathUnits", "maskUnits", "patternUnits"].includes(attr.name)) {
          if (attr.value.length >= (["d", "points"].includes(attr.name) ? 1e5 : 1e3)) throw Error("SVG \u5C5E\u6027\u8D85\u8FC7\u5B89\u5168\u5927\u5C0F\u9650\u5236");
          const v = ["d", "points"].includes(attr.name) && !/url\s*\(|javascript:|data:|[<>\\@]/i.test(attr.value) ? attr.value : cssValue(attr.value);
          if (v && !/[<>]/.test(v)) target.attrs[attr.name] = v;
        } else if (["href", "src"].includes(attr.name)) stats.externalLinks++;
      }
      if (original.hasAttribute("colspan") || original.hasAttribute("rowspan")) omissions.add("Markdown \u5408\u5E76\u5355\u5143\u683C\u4FDD\u7559\u4E3A\u5B89\u5168 HTML \u8868\u683C\uFF1B\u7EAF Markdown \u9605\u8BFB\u5668\u53EF\u80FD\u4E0D\u6E32\u67D3\uFF0C\u89C6\u89C9\u4EE5 HTML \u4E3A\u51C6");
      if (name === "details" && original.open) target.attrs.open = "";
      if (name === "button") {
        target.attrs.disabled = "";
        omissions.add("\u4E0D\u6062\u590D\u6765\u6E90\u6309\u94AE\u4E8B\u4EF6\uFF1B\u4EC5\u660E\u786E\u5217\u51FA\u7684\u81EA\u6709 recipe \u53EF\u4EE5\u542F\u7528");
      }
      if (css.animationName !== "none") omissions.add("\u52A8\u753B\u4EC5\u6355\u83B7\u5F53\u524D\u8BA1\u7B97\u6837\u5F0F\uFF0C\u672A\u4FDD\u7559\u65F6\u95F4\u8F74");
      const children = original.shadowRoot?.childNodes || original.childNodes;
      if (original.shadowRoot) {
        target.evidence = { status: "captured", method: "flattened-shadow" };
      }
      if (original.shadowRoot) omissions.add("\u5F00\u653E Shadow DOM \u5DF2\u5C55\u5F00\u4E3A\u9759\u6001\u8282\u70B9\uFF1Bslot \u5206\u53D1\u548C\u5C01\u95ED Shadow DOM \u4E0D\u4FDD\u8BC1\u5B8C\u6574");
      else if (name.includes("-")) omissions.add("\u5C01\u95ED Shadow DOM \u6216\u81EA\u5B9A\u4E49\u7EC4\u4EF6\u5185\u90E8\u4E0D\u53EF\u786E\u8BA4");
      const pseudos = [];
      for (const pseudo of ["::before", "::after"]) {
        const p = getComputedStyle(original, pseudo);
        if (p.content && p.content !== "none" && p.content !== "normal") {
          try {
            const content = JSON.parse(p.content);
            if (typeof content !== "string") throw Error();
            const replacement = node("span");
            replacement.evidence = { status: "captured", method: "generated-pseudo" };
            replacement.style = styles(p);
            replacement.children = [{ text: content }];
            pseudos.push([pseudo, replacement]);
          } catch {
            omissions.add("\u590D\u6742 CSS \u4F2A\u5143\u7D20\uFF08\u8BA1\u6570\u5668/\u56FE\u50CF/\u591A\u6BB5\u5185\u5BB9\uFF09\u672A\u6355\u83B7");
          }
        }
      }
      if (pseudos.find((x) => x[0] === "::before")) target.children.push(pseudos.find((x) => x[0] === "::before")[1]);
      for (const c of children) {
        const out = await clone(c, depth + 1);
        if (out) target.children.push(out);
      }
      if (pseudos.find((x) => x[0] === "::after")) target.children.push(pseudos.find((x) => x[0] === "::after")[1]);
      if (original.scrollTop || original.scrollLeft) {
        target.state = { scrollTop: original.scrollTop, scrollLeft: original.scrollLeft };
        const wrapper = node("div");
        wrapper.evidence = { status: "captured", method: "scroll-flattened" };
        for (const k of ["display", "flex-direction", "flex-wrap", "align-items", "justify-content", "gap", "grid-template-columns", "grid-template-rows", "column-gap", "row-gap"]) if (target.style[k]) wrapper.style[k] = target.style[k];
        wrapper.style.width = original.scrollWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight) + "px";
        wrapper.style.height = original.scrollHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom) + "px";
        wrapper.style.transform = `translate(${-original.scrollLeft}px, ${-original.scrollTop}px)`;
        wrapper.style["transform-origin"] = "0px 0px";
        wrapper.children = target.children;
        target.children = [wrapper];
        target.style.display = "block";
        target.style.overflow = "hidden";
        omissions.add("\u6EDA\u52A8\u5F53\u524D\u504F\u79FB\u5DF2\u9759\u6001\u5C55\u5F00\uFF1B\u540E\u7EED\u6EDA\u52A8\u548C\u7C98\u6027\u5B9A\u4F4D\u4E0D\u6062\u590D");
      }
      return target;
    }
    for (const c of candidates) {
      if (["tabs@1", "state@1"].includes(c.recipe)) for (const el of componentRoles(c.root).get("panel") || []) controlledPanels.add(el);
      if (!["table@1", "tabs@1", "state@1"].includes(c.recipe)) continue;
      for (const el of c.root.querySelectorAll(c.recipe === "table@1" ? "tr[hidden]" : '[data-uip-role="panel"][hidden]')) {
        if (el.closest("[data-uip-recipe]") !== c.root) continue;
        originallyHidden.add(el);
      }
    }
    const treeCaptured = await clone(selected);
    let tree = treeCaptured;
    if (!tree) throw Error("\u8FD9\u4E2A\u533A\u57DF\u6CA1\u6709\u53EF\u4EE5\u5BFC\u51FA\u7684\u53EF\u89C1\u5185\u5BB9");
    const rootCss = getComputedStyle(selected), rootWidth = rootCss.transform === "none" ? rect.width : selected.offsetWidth || rect.width, rootHeight = rootCss.transform === "none" ? rect.height : selected.offsetHeight || rect.height;
    Object.assign(tree.style, { "margin": "0", "position": "relative", "top": "auto", "right": "auto", "bottom": "auto", "left": "auto", "box-sizing": "border-box", "width": rootWidth + "px", "height": rootHeight + "px" });
    if (rootCss.display === "inline") tree.style.display = "inline-block";
    if (rootCss.transform !== "none") {
      const matrix = new DOMMatrix(rootCss.transform);
      if (matrix.is2D && selected.offsetWidth) {
        const [ox, oy] = rootCss.transformOrigin.split(" ").map(parseFloat);
        const corners = [[0, 0], [rootWidth, 0], [0, rootHeight], [rootWidth, rootHeight]].map(([x, y]) => ({ x: matrix.a * (x - ox) + matrix.c * (y - oy) + ox + matrix.e, y: matrix.b * (x - ox) + matrix.d * (y - oy) + oy + matrix.f }));
        const minX = Math.min(...corners.map((p) => p.x)), minY = Math.min(...corners.map((p) => p.y));
        tree.style.transform = `matrix(${matrix.a},${matrix.b},${matrix.c},${matrix.d},${matrix.e + ox - matrix.a * ox - matrix.c * oy - minX},${matrix.f + oy - matrix.b * ox - matrix.d * oy - minY})`;
        tree.style["transform-origin"] = "0px 0px";
        const wrapper = node("div");
        wrapper.style = { width: rect.width + "px", height: rect.height + "px", overflow: "hidden" };
        wrapper.children = [tree];
        tree = wrapper;
      } else {
        tree.style.transform = "none";
        omissions.add("\u6839\u8282\u70B9 3D/SVG \u53D8\u6362\u672A\u590D\u539F\uFF0C\u5DF2\u964D\u7EA7\u4E3A\u672A\u53D8\u6362\u5E03\u5C40");
      }
    }
    let background = "transparent";
    for (let el = selected; el; el = el.parentElement) {
      const c = getComputedStyle(el).backgroundColor;
      if (c !== "rgba(0, 0, 0, 0)" && c !== "transparent") {
        background = c;
        break;
      }
    }
    if (background === "transparent") background = matchMedia("(prefers-color-scheme: dark)").matches ? "#202124" : "#fff";
    const behaviors = [], paths = new Map([...nodes(tree)].map(([p, n]) => [n, p]));
    for (const candidate of candidates) {
      try {
        const behavior = extractCandidate(candidate, captured, paths, contract.evidence);
        validateBehaviors({ tree, behaviors: [...behaviors, behavior] });
        behaviors.push(behavior);
      } catch (error) {
        const fallback = await captureElement(selected, { signal, exclude, onProgress, source, method, controlled: false });
        fallback.omissions.push(`\u7EC4\u4EF6 ${candidate.recipe} \u6355\u83B7\u671F\u95F4\u6539\u53D8\uFF0C\u5DF2\u91CD\u65B0\u6309\u9ED8\u8BA4\u8131\u654F\u6355\u83B7\uFF1A${error.message}`);
        return validateSnapshot(fallback);
      }
    }
    const s = { schemaVersion: VERSION, behaviors, kind: "ui-portability-snapshot", capability: "static", createdAt: (/* @__PURE__ */ new Date()).toISOString(), source, dimensions: { width: Math.ceil(rect.width), height: Math.ceil(rect.height) }, background, tree, resources, provenance: { method, status: "captured" }, stats, omissions: [...omissions], limitations: ["\u4E0D\u662F\u539F\u59CB\u4EA4\u4E92\u7684\u65E0\u635F\u590D\u5236", "\u56FA\u5B9A\u5C3A\u5BF8\u9759\u6001\u5E03\u5C40\uFF1B\u4E0D\u4FDD\u8BC1\u5B8C\u6574\u54CD\u5E94\u5F0F\u89C4\u5219"], security: { redacted: true, remoteResources: false, scripts: false } };
    return validateSnapshot(s);
  }

  // extension/src/core/render.js
  var escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function fragment(s, { strategy = "static" } = {}) {
    validateSnapshot(s);
    const resources = new Map(s.resources.map((r) => [r.id, r]));
    const active = strategy !== "static", analysis = analyze(s, strategy);
    const hiddenRows = /* @__PURE__ */ new Set();
    const treeMap = nodes(s.tree);
    for (const b of s.behaviors || []) {
      if (b.recipe === "table@1") {
        const body = treeMap.get(b.bindings.body), visible = new Set(tableOrder(tableRows(body), b.state));
        body.children.forEach((_, i) => {
          if (!visible.has(i)) hiddenRows.add(b.bindings.body + "." + i);
        });
      }
    }
    const bindings = new Set(active ? (s.behaviors || []).flatMap((b) => bindingPaths(b.bindings)) : []);
    function render(n, path = "0") {
      if (Object.hasOwn(n, "text")) return escape(n.text);
      const r = resources.get(n.resourceId);
      const attrs = { ...n.attrs };
      if (hiddenRows.has(path)) attrs.hidden = "";
      if (bindings.has(path)) attrs["data-uip-node"] = path;
      if (n.tag === "details" && !active) attrs.inert = "";
      if (r) attrs.src = `data:${r.mime};base64,${r.data}`;
      if (n.ns === "svg" && n.tag === "svg") attrs.xmlns = "http://www.w3.org/2000/svg";
      if (n.ns === "math" && n.tag === "math") attrs.xmlns = "http://www.w3.org/1998/Math/MathML";
      const style = { ...n.style };
      const recipeAncestor = (s.behaviors || []).some((b) => b.bindings.root === path || b.bindings.root.startsWith(path + "."));
      const nativeAncestor = active && analysis.components.some((c) => c.recipe === "native-details@1" && (c.path === path || c.path.startsWith(path + ".")));
      if (active && recipeAncestor || nativeAncestor) {
        style.height = "auto";
        if (style.display === "grid") style["grid-template-rows"] = "none";
      }
      if (active && (s.behaviors || []).some((b) => b.recipe === "table@1" && path.startsWith(b.bindings.root + ".") && ["table", "tbody", "tr", "td", "th"].includes(n.tag))) style.height = "auto";
      const css = Object.entries(style).map(([k, v]) => `${k}:${v}`).join(";");
      const tag = `<${n.tag}${Object.entries(attrs).map(([k, v]) => ` ${k}="${escape(v)}"`).join("")}${css ? ` style="${escape(css)}"` : ""}>`;
      return tag + (["img", "input", "br", "hr"].includes(n.tag) ? "" : n.children.map((c, i) => render(c, path + "." + i)).join("") + `</${n.tag}>`);
    }
    return render(s.tree);
  }
  function svg(s) {
    validateSnapshot(s);
    if (s.tree.ns !== "svg" || s.tree.tag !== "svg") return null;
    const body = fragment(s);
    return body.replace(/(<svg[^>]*>)/, `$1<metadata>${escape(JSON.stringify(diagnostic(s)))}</metadata>`);
  }

  // extension/src/capture/picker.js
  (() => {
    "use strict";
    globalThis.__uiPortabilityCleanup?.();
    globalThis.__uiPortabilityActive = true;
    const format = globalThis.__UI_PORTABILITY_FORMAT__ || "html";
    const controlled = globalThis.__UI_PORTABILITY_CONTROLLED__ === true;
    const host = document.createElement("div");
    host.dataset.uipPicker = "";
    host.style.cssText = "all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important";
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `<style>:host{color-scheme:light dark;--bg:#fff;--fg:#172b2c;--muted:#526769;--line:#cbd5d5;--accent:#0f7b6c;--ink:#fff;--panel:#edf2f1}.panel{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);width:max-content;max-width:calc(100vw - 32px);box-sizing:border-box;background:var(--bg);color:var(--fg);font:13px/1.6 system-ui;padding:16px;border:1px solid var(--line);border-top:3px solid var(--accent);border-radius:8px;box-shadow:0 4px 24px #0002;pointer-events:auto}button{min-height:44px;padding:8px 12px;margin:12px 6px 0 0;font:inherit;border:1px solid var(--line);border-radius:5px;background:var(--bg);color:var(--fg);cursor:pointer}button:hover{border-color:var(--accent)}button:disabled{opacity:.4}button:focus-visible{outline:2px solid var(--accent);outline-offset:3px}#preview{background:var(--accent);color:var(--ink);border-color:var(--accent);font-weight:600}#outline{position:fixed;border:2px solid var(--accent);box-sizing:border-box;background:#0f7b6c12;pointer-events:none;display:none}#label{font-weight:650;margin-bottom:4px}.hint{font-size:12px;color:var(--muted)}#error{color:var(--fg);white-space:pre-wrap;overflow-wrap:anywhere;max-width:620px}#error:not(:empty){border-left:2px solid var(--accent);padding-left:8px;margin-top:8px}@media(prefers-color-scheme:dark){:host{--bg:#182627;--fg:#e4eeee;--muted:#acbfbf;--line:#465b5b;--accent:#5edcd3;--ink:#112b2c;--panel:#203233}}@media(max-width:600px){.panel{padding:12px;width:calc(100vw - 32px)}button{font-size:12px;padding:8px;margin-right:4px}}@media(forced-colors:active){#outline{border-color:Highlight}button:focus-visible{outline-color:Highlight}}</style><div id="outline"></div><div class="panel"><div id="label">\u79FB\u52A8\u6307\u9488\u9009\u62E9\u533A\u57DF\uFF0C\u5355\u51FB\u9501\u5B9A</div><div class="hint">\u2191 \u6269\u5927\u5230\u7236\u5BB9\u5668 \xB7 \u2193 \u8FD4\u56DE\u5B50\u533A\u57DF \xB7 Enter \u9884\u89C8 \xB7 Esc \u53D6\u6D88</div><div id="error" role="status"></div><button id="parent">\u6269\u5927\u533A\u57DF \u2191</button><button id="child">\u7F29\u5C0F\u533A\u57DF \u2193</button><button id="preview">\u6355\u83B7\u5E76\u9884\u89C8</button><button id="cancel">\u53D6\u6D88</button></div>`;
    document.documentElement.append(host);
    const outline = shadow.getElementById("outline");
    let last = null, locked = false, trail = [], busy = false, controller = null;
    function status(text2) {
      if (globalThis.chrome?.runtime?.id) chrome.runtime.sendMessage({ type: "pickerStatus", status: text2 }).catch(() => {
      });
    }
    function draw() {
      if (!last?.isConnected) {
        last = null;
        outline.style.display = "none";
        return;
      }
      const r = last.getBoundingClientRect();
      Object.assign(outline.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", display: "block" });
      shadow.getElementById("label").textContent = `${locked ? "\u5DF2\u9501\u5B9A" : "\u5019\u9009"}\uFF1A${last.localName} \xB7 ${Math.round(r.width)} \xD7 ${Math.round(r.height)} px`;
      shadow.getElementById("parent").disabled = !last.parentElement || last.parentElement === document.documentElement;
      shadow.getElementById("child").disabled = !trail.length;
    }
    function point(e) {
      if (locked || busy || e.composedPath().includes(host)) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      last = target.closest('svg,section,article,figure,table,[role="region"],[role="table"],[role="img"]') || target;
      trail = [];
      draw();
    }
    function parent() {
      if (last?.parentElement && last.parentElement !== document.documentElement) {
        trail.push(last);
        last = last.parentElement;
        locked = true;
        draw();
      }
    }
    function child() {
      if (trail.length) {
        last = trail.pop();
        locked = true;
        draw();
      }
    }
    function cleanup() {
      window.removeEventListener("pointermove", point, true);
      window.removeEventListener("click", choose, true);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("scroll", draw, true);
      window.removeEventListener("resize", draw);
      controller?.abort();
      host.remove();
      globalThis.__uiPortabilityActive = false;
      delete globalThis.__uiPortabilityCleanup;
    }
    globalThis.__uiPortabilityCleanup = cleanup;
    function key(e) {
      if (!["Escape", "ArrowUp", "ArrowDown", "Enter"].includes(e.key) || busy && e.key !== "Escape") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.key === "Escape") {
        cleanup();
        status("\u5DF2\u53D6\u6D88\uFF0C\u53EF\u91CD\u65B0\u9009\u62E9");
      } else if (e.key === "ArrowUp") parent();
      else if (e.key === "ArrowDown") child();
      else capture();
    }
    shadow.getElementById("parent").onclick = parent;
    shadow.getElementById("child").onclick = child;
    shadow.getElementById("preview").onclick = () => capture();
    shadow.getElementById("cancel").onclick = () => {
      cleanup();
      status("\u5DF2\u53D6\u6D88\uFF0C\u53EF\u91CD\u65B0\u9009\u62E9");
    };
    function choose(e) {
      if (e.composedPath().includes(host)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (busy) return;
      if (!locked) point(e);
      if (last) {
        locked = true;
        draw();
      }
    }
    async function capture() {
      if (!last || busy) return;
      busy = true;
      controller = new AbortController();
      const signal = controller.signal;
      shadow.getElementById("error").textContent = "\u6355\u83B7\u4E2D\u2026 Esc \u53EF\u53D6\u6D88";
      try {
        const snapshot = await captureElement(last, { signal, controlled, exclude: host, onProgress: (n) => shadow.getElementById("error").textContent = `\u6355\u83B7\u4E2D\u2026 ${n} \u8282\u70B9 \xB7 Esc \u53EF\u53D6\u6D88` });
        if (format === "svg" && !svg(snapshot)) throw Error("SVG \u683C\u5F0F\u53EA\u80FD\u9009\u62E9 SVG \u6839\u5143\u7D20");
        if (signal.aborted) return;
        if (!globalThis.chrome?.runtime?.id) throw Error("\u8BF7\u901A\u8FC7\u5DF2\u5B89\u88C5\u6269\u5C55\u7684 Popup \u542F\u52A8\u6355\u83B7");
        const response = await chrome.runtime.sendMessage({ type: "capture", snapshot, format });
        if (response?.error) throw Error(response.error);
        cleanup();
      } catch (error) {
        if (!signal.aborted) {
          status("\u6355\u83B7\u5931\u8D25\uFF1A" + error.message);
          shadow.getElementById("error").textContent = "\u6355\u83B7\u5931\u8D25\uFF1A" + error.message + "\u3002\u53EF\u91CD\u9009\u540E\u518D\u8BD5\u3002";
        }
      } finally {
        busy = false;
      }
    }
    window.addEventListener("pointermove", point, true);
    window.addEventListener("click", choose, true);
    window.addEventListener("keydown", key, true);
    window.addEventListener("scroll", draw, true);
    window.addEventListener("resize", draw);
    status("\u6B63\u5728\u9009\u62E9 \xB7 \u5355\u51FB\u9501\u5B9A\uFF0C\u2191 \u6269\u5927\uFF0CEnter \u9884\u89C8\uFF0CEsc \u53D6\u6D88");
  })();
})();
