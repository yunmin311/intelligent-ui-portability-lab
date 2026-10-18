(() => {
  // extension/src/core/raster.js
  function rasterDimensions(bytes2, mime) {
    const v = new DataView(bytes2.buffer, bytes2.byteOffset, bytes2.byteLength);
    let width, height;
    const ascii = (start, n) => String.fromCharCode(...bytes2.slice(start, start + n));
    if (mime === "image/png" && bytes2.length >= 24 && ascii(12, 4) === "IHDR") {
      width = v.getUint32(16);
      height = v.getUint32(20);
    } else if (mime === "image/jpeg" && bytes2[0] === 255 && bytes2[1] === 216) {
      let p = 2;
      while (p + 4 <= bytes2.length) {
        if (bytes2[p++] !== 255) break;
        while (bytes2[p] === 255) p++;
        const marker = bytes2[p++];
        if (marker === 217 || marker === 218) break;
        if (marker === 1 || marker >= 208 && marker <= 215) continue;
        const size = v.getUint16(p);
        if (size < 2 || p + size > bytes2.length) break;
        if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker) && size >= 8) {
          height = v.getUint16(p + 3);
          width = v.getUint16(p + 5);
          break;
        }
        p += size;
      }
    } else if (mime === "image/webp" && bytes2.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
      const kind = ascii(12, 4);
      if (kind === "VP8X") {
        width = 1 + bytes2[24] + (bytes2[25] << 8) + (bytes2[26] << 16);
        height = 1 + bytes2[27] + (bytes2[28] << 8) + (bytes2[29] << 16);
      } else if (kind === "VP8 " && bytes2[23] === 157 && bytes2[24] === 1 && bytes2[25] === 42) {
        width = v.getUint16(26, true) & 16383;
        height = v.getUint16(28, true) & 16383;
      } else if (kind === "VP8L" && bytes2[20] === 47) {
        width = 1 + bytes2[21] + ((bytes2[22] & 63) << 8);
        height = 1 + (bytes2[22] >> 6) + (bytes2[23] << 2) + ((bytes2[24] & 15) << 10);
      }
    }
    if (!width || !height) throw Error("\u56FE\u7247\u5934\u635F\u574F\u6216\u4E0D\u652F\u6301\uFF0C\u65E0\u6CD5\u5B89\u5168\u786E\u8BA4\u5C3A\u5BF8");
    if (width > 4096 || height > 4096 || width * height > 1e6) throw Error("\u56FE\u7247\u8D85\u8FC7 100 \u4E07\u50CF\u7D20\u6216 4096 px\uFF0C\u8BF7\u5148\u7F29\u5C0F");
    return { width, height };
  }

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

  // extension/src/core/interactions.js
  var trustFixtureURL = (url) => {
    try {
      const u = new URL(url);
      return u.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname) && u.pathname === "/selective-interactions.html";
    } catch {
      return false;
    }
  };
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
  function validateBehaviors(s) {
    const bs = s.behaviors || [];
    if (!Array.isArray(bs) || bs.length > 20) throw Error("\u4EA4\u4E92\u6570\u91CF\u8D85\u9650");
    const map = nodes(s.tree), used = /* @__PURE__ */ new Set();
    for (const b of bs) {
      if (!exact(b, ["recipe", "bindings", "state", "evidence"]) || b.evidence !== "fixture-equivalence-v1") throw Error("\u4EA4\u4E92\u8BC1\u636E\u5B57\u6BB5\u4E0D\u5408\u6CD5");
      const keys = b.recipe === "fourier@1" ? ["root", "harmonics", "amplitude", "phase", "curve", "output"] : b.recipe === "table@1" ? ["root", "filter", "sort", "body", "output"] : null;
      if (!keys || !exact(b.bindings, keys)) throw Error("\u4EA4\u4E92 recipe \u4E0D\u652F\u6301");
      if (new Set(Object.values(b.bindings)).size !== keys.length) throw Error("\u4EA4\u4E92\u7ED1\u5B9A\u91CD\u590D");
      const refs = {};
      for (const k of keys) {
        const path = b.bindings[k];
        if (typeof path !== "string" || !/^0(?:\.\d{1,4}){0,75}$/.test(path) || !map.has(path) || used.has(path)) throw Error("\u4EA4\u4E92\u7ED1\u5B9A\u4E0D\u5408\u6CD5");
        if (k !== "root" && !path.startsWith(b.bindings.root + ".")) throw Error("\u7ED1\u5B9A\u8D85\u51FA\u7EC4\u4EF6");
        refs[k] = map.get(path);
        used.add(path);
      }
      if (refs.root.ns !== "html" || !["section", "div", "article"].includes(refs.root.tag) || refs.output.tag !== "output") throw Error("\u7EC4\u4EF6\u7ED3\u6784\u4E0D\u5339\u914D");
      const range = (n, min, max, step, value) => {
        if (n.tag !== "input" || n.attrs.type !== "range" || Number(n.attrs.min) !== min || Number(n.attrs.max) !== max || Number(n.attrs.step) !== step || Number(n.attrs.value) !== value) throw Error("\u6ED1\u5757\u6A21\u578B\u4E0D\u5339\u914D");
      };
      if (b.recipe === "fourier@1") {
        if (!exact(b.state, ["harmonics", "amplitude", "phase"])) throw Error("Fourier \u72B6\u6001\u5B57\u6BB5\u4E0D\u5408\u6CD5");
        const d = fourierPath(b.state);
        if (refs.curve.tag !== "path" || refs.curve.ns !== "svg" || refs.curve.attrs.d !== d) throw Error("\u66F2\u7EBF\u4E0E\u6A21\u578B\u4E0D\u4E00\u81F4");
        range(refs.harmonics, 1, 12, 1, b.state.harmonics);
        range(refs.amplitude, 0, 1.5, 0.1, b.state.amplitude);
        range(refs.phase, -3.14, 3.14, 0.01, b.state.phase);
      } else {
        if (!exact(b.state, ["minimum", "direction"]) || refs.sort.tag !== "button") throw Error("\u8868\u683C\u72B6\u6001\u5B57\u6BB5\u4E0D\u5408\u6CD5");
        tableOrder(tableRows(refs.body), b.state);
        range(refs.filter, 0, 50, 1, b.state.minimum);
      }
    }
    return bs;
  }

  // extension/src/core/policy.js
  var allowedHtml = new Set("a article aside blockquote br button caption code dd details div dl dt em figcaption figure h1 h2 h3 h4 h5 h6 header hr i kbd label li main mark ol p pre q s samp section small span strong sub summary sup output table tbody td th thead tfoot time tr u ul".split(" "));
  var allowedSvg = new Set("svg g defs path rect circle ellipse line polyline polygon text tspan lineargradient radialgradient stop clippath mask pattern title desc".split(" "));
  var allowedAttributes = new Set("viewBox width height x y x1 x2 y1 y2 cx cy r rx ry d points transform fill stroke stroke-width stroke-linecap stroke-linejoin opacity fill-opacity stroke-opacity offset stop-color stop-opacity preserveAspectRatio xmlns vector-effect clip-path mask stroke-dasharray stroke-dashoffset text-anchor dominant-baseline colspan rowspan".split(" "));
  var styleProps = ["visibility", "direction", "writing-mode", "color-scheme", "background-image", "background-size", "background-position", "background-repeat", "border-collapse", "border-spacing", "table-layout", "caption-side", "list-style-type", "list-style-position", "font-variant", "font-stretch", "word-break", "overflow-wrap", "text-indent", "text-transform", "text-overflow", "text-shadow", "float", "clear", "align-self", "align-content", "justify-items", "justify-self", "column-gap", "row-gap", "grid-auto-flow", "grid-auto-rows", "grid-auto-columns", "flex-grow", "flex-shrink", "flex-basis", "order", "aspect-ratio", "max-height", "object-position", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "fill-opacity", "stroke-opacity", "stop-color", "stop-opacity", "text-anchor", "dominant-baseline", "clip-path", "mask", "transform", "transform-origin", "display", "position", "top", "right", "bottom", "left", "z-index", "box-sizing", "color", "background-color", "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "text-align", "white-space", "width", "height", "max-width", "min-width", "min-height", "margin", "margin-top", "margin-right", "margin-bottom", "margin-left", "padding", "padding-top", "padding-right", "padding-bottom", "padding-left", "border", "border-width", "border-style", "border-color", "border-radius", "box-shadow", "opacity", "vertical-align", "flex", "flex-direction", "flex-wrap", "align-items", "justify-content", "gap", "grid-template-columns", "grid-template-rows", "grid-column", "grid-row", "overflow", "text-decoration", "object-fit"];
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
  var VERSION = "1.1.0";
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
    if (![VERSION, "1.0.0"].includes(s.schemaVersion)) throw Error("\u4E0D\u652F\u6301\u7684 schemaVersion\uFF1B\u8BF7\u8FC1\u79FB\u6216\u4F7F\u7528\u539F\u7248\u672C");
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
      for (const [k, v] of Object.entries(n.attrs)) {
        str(v, ["d", "points"].includes(k) ? 1e5 : 1e3);
        if (/[<>]|javascript:|data:|[\x00-\x08]/i.test(v) || /url\s*\(/i.test(v) && !localReference(v)) throw Error("\u6D3B\u52A8\u5C5E\u6027\u4E0D\u5408\u6CD5");
        if (!["d", "points"].includes(k) && !safeCss(v) && !localReference(v)) throw Error("\u5C5E\u6027\u8D44\u6E90\u8BED\u6CD5\u4E0D\u5408\u6CD5");
        if (k === "id" && !/^uip-\d+$/.test(v)) throw Error("ID \u4E0D\u5408\u6CD5");
      }
      if (n.tag === "input" && (!["range", "checkbox", "radio"].includes(n.attrs.type) || n.attrs.disabled !== "") || n.tag === "button" && n.attrs.disabled !== "") throw Error("\u63A7\u4EF6\u5FC5\u987B\u9759\u6001\u7981\u7528");
      own(n.style, styleProps);
      for (const v of Object.values(n.style)) if (!safeCss(v) && !localReference(v)) throw Error("\u6D3B\u52A8\u6837\u5F0F\u4E0D\u5408\u6CD5");
      if (n.state) {
        own(n.state, ["scrollTop", "scrollLeft"]);
        for (const v of Object.values(n.state)) if (!Number.isFinite(v) || v < 0 || v > 1e6) throw Error("\u72B6\u6001\u4E0D\u5408\u6CD5");
      }
      if (n.resourceId && (!ids.has(n.resourceId) || n.tag !== "img")) throw Error("\u8D44\u6E90\u4E0D\u5B58\u5728");
      list(n.children, LIMITS.nodes);
      n.children.forEach((c) => walk(c, depth + 1));
    }
    walk(s.tree, 0);
    if (s.schemaVersion === "1.0.0" && s.behaviors) throw Error("\u65E7\u7248\u4E0D\u5141\u8BB8\u4EA4\u4E92");
    validateBehaviors(s);
    if (bytes(s) > LIMITS.bytes) throw Error("\u5FEB\u7167\u8D85\u8FC7 4 MB");
    return s;
  }

  // extension/src/capture/dom.js
  async function captureElement(selected, { signal, exclude, onProgress = () => {
  }, source = { type: "page", origin: location.origin }, method = "sanitized-dom" } = {}) {
    if (!selected?.isConnected) throw Error("\u6240\u9009\u533A\u57DF\u5DF2\u88AB\u9875\u9762\u79FB\u9664");
    const rect = selected.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1 || rect.width > 12e3 || rect.height > 12e3) throw Error("\u533A\u57DF\u5C3A\u5BF8\u987B\u5728 1\u201312000 px \u4E4B\u95F4");
    const captured = /* @__PURE__ */ new WeakMap();
    let visited = 0, textSize = 0, resourceSize = 0;
    const resources = [], ids = /* @__PURE__ */ new Map();
    const stats = { elements: 0, omittedImages: 0, canvasImages: 0, omittedFrames: 0, redactedControls: 0, externalLinks: 0, truncated: false, svg: 0 };
    const omissions = /* @__PURE__ */ new Set(["\u672A\u4FDD\u5B58\u6765\u6E90\u811A\u672C\u548C\u4E8B\u4EF6\uFF1B\u53EF\u6062\u590D\u7684\u539F\u751F\u884C\u4E3A\u4E0E\u81EA\u6709 recipe \u4EE5\u4EA4\u4E92\u62A5\u544A\u4E3A\u51C6", "\u81EA\u5B9A\u4E49\u5B57\u4F53\u6587\u4EF6\u672A\u5D4C\u5165\uFF1B\u79BB\u7EBF\u7AEF\u53EF\u80FD\u4F7F\u7528\u7CFB\u7EDF\u56DE\u9000\u5B57\u4F53", "\u53EA\u6355\u83B7\u5F53\u524D\u5DF2\u6302\u8F7D DOM\uFF1B\u4E0D\u4FDD\u8BC1\u865A\u62DF\u5217\u8868\u3001\u672A\u5C55\u5F00\u6216\u672A\u52A0\u8F7D\u5185\u5BB9\u5B8C\u6574", "\u6B63\u6587\u548C Canvas \u4E2D\u7684\u654F\u611F\u4FE1\u606F\u4E0D\u80FD\u81EA\u52A8\u8BC6\u522B\uFF0C\u8BF7\u4E0B\u8F7D\u524D\u68C0\u67E5"]);
    const scan = [{ node: selected, depth: 0 }];
    let seen = 0;
    while (scan.length) {
      const { node: node2, depth } = scan.pop();
      if (++seen > 5e3 || depth > 75) throw Error("\u6355\u83B7\u8D85\u8FC7 5000 \u8282\u70B9\u6216 75 \u5C42\uFF0C\u8BF7\u7F29\u5C0F\u533A\u57DF");
      if (node2.nodeType === 1 && node2.id) ids.set(node2.id, "uip-" + ids.size);
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
      if (css.display === "none" || ["hidden", "collapse"].includes(css.visibility)) return null;
      let target = node();
      captured.set(original, target);
      target.style = styles(css);
      stats.elements++;
      if (["input", "textarea", "select"].includes(name) || original.isContentEditable) {
        stats.redactedControls++;
        target.evidence = { status: "unsupported", method: "redacted" };
        omissions.add("\u8F93\u5165\u53CA\u53EF\u7F16\u8F91\u5185\u5BB9\u5DF2\u8131\u654F\uFF1B\u672A\u77E5\u63A7\u4EF6\u4EC5\u663E\u793A\u5B89\u5168\u9759\u6001\u72B6\u6001");
        if (name === "input" && ["range", "checkbox", "radio"].includes(original.type)) {
          target.tag = "input";
          target.component = "control";
          target.attrs = { type: original.type, disabled: "" };
          if (original.type === "range") for (const k of ["min", "max", "step", "value"]) target.attrs[k] = String(original[k]).slice(0, 30);
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
      for (const attr of original.attributes) {
        if (allowedAttributes.has(attr.name) || ["gradientUnits", "gradientTransform", "clipPathUnits", "maskUnits", "patternUnits"].includes(attr.name)) {
          if (attr.value.length >= (["d", "points"].includes(attr.name) ? 1e5 : 1e3)) throw Error("SVG \u5C5E\u6027\u8D85\u8FC7\u5B89\u5168\u5927\u5C0F\u9650\u5236");
          const v = ["d", "points"].includes(attr.name) && !/url\s*\(|javascript:|data:|[<>\\@]/i.test(attr.value) ? attr.value : cssValue(attr.value);
          if (v && !/[<>]/.test(v)) target.attrs[attr.name] = v;
        } else if (["href", "src"].includes(attr.name)) stats.externalLinks++;
      }
      if (original.hasAttribute("colspan") || original.hasAttribute("rowspan")) omissions.add("Markdown \u5408\u5E76\u5355\u5143\u683C\u4F1A\u964D\u7EA7\u4E3A\u666E\u901A\u8868\u683C\uFF0C\u89C6\u89C9\u4EE5 HTML \u4E3A\u51C6");
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
    const revealed = [];
    if (method === "sanitized-dom" && trustFixtureURL(location.href)) for (const el of selected.querySelectorAll('[data-uip-recipe="table@1"] tr[hidden]')) {
      revealed.push(el);
      el.hidden = false;
    }
    if (method === "sanitized-dom" && trustFixtureURL(location.href) && selected.matches('[data-uip-recipe="table@1"]')) for (const el of selected.querySelectorAll("tr[hidden]")) {
      revealed.push(el);
      el.hidden = false;
    }
    let tree;
    try {
      tree = await clone(selected);
    } finally {
      for (const el of revealed) el.hidden = true;
    }
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
    const behaviors = [];
    if (method === "sanitized-dom" && trustFixtureURL(location.href)) {
      const paths = new Map([...nodes(tree)].map(([p, n]) => [n, p]));
      for (const root of [selected, ...selected.querySelectorAll("[data-uip-recipe]")]) {
        const recipe = root.getAttribute("data-uip-recipe");
        if (!["fourier@1", "table@1"].includes(recipe)) continue;
        const bindings = { root: paths.get(captured.get(root)) };
        for (const el of root.querySelectorAll("[data-uip-role]")) bindings[el.getAttribute("data-uip-role")] = paths.get(captured.get(el));
        const value = (key) => Number(root.querySelector(`[data-uip-role="${key}"]`).value);
        const state = recipe === "fourier@1" ? { harmonics: value("harmonics"), amplitude: value("amplitude"), phase: value("phase") } : { minimum: value("filter"), direction: root.dataset.direction || "asc" };
        behaviors.push({ recipe, bindings, state, evidence: "fixture-equivalence-v1" });
      }
    }
    const s = { schemaVersion: "1.1.0", behaviors, kind: "ui-portability-snapshot", capability: "static", createdAt: (/* @__PURE__ */ new Date()).toISOString(), source, dimensions: { width: Math.ceil(rect.width), height: Math.ceil(rect.height) }, background, tree, resources, provenance: { method, status: "captured" }, stats, omissions: [...omissions], limitations: ["\u4E0D\u662F\u539F\u59CB\u4EA4\u4E92\u7684\u65E0\u635F\u590D\u5236", "\u56FA\u5B9A\u5C3A\u5BF8\u9759\u6001\u5E03\u5C40\uFF1B\u4E0D\u4FDD\u8BC1\u5B8C\u6574\u54CD\u5E94\u5F0F\u89C4\u5219"], security: { redacted: true, remoteResources: false, scripts: false } };
    return validateSnapshot(s);
  }

  // extension/src/import-sandbox.js
  var active = false;
  function sanitize(text2, type) {
    const doc = new DOMParser().parseFromString(text2, type === "svg" ? "image/svg+xml" : "text/html");
    if (doc.querySelector("parsererror")) throw Error("SVG \u89E3\u6790\u5931\u8D25");
    const styles = [];
    let count = 0;
    const filter = (style2) => {
      const out = [];
      for (const key of style2) {
        const v = style2.getPropertyValue(key);
        if ((styleProps.includes(key) || /^--[a-z0-9-]+$/i.test(key)) && safeCss(v)) out.push(key + ":" + v);
      }
      return out.join(";");
    };
    function clone(n, depth = 0) {
      if (++count > 5e3 || depth > 75) throw Error("\u5BFC\u5165\u8D85\u8FC7 5000 \u8282\u70B9\u6216 75 \u5C42");
      if (n.nodeType === 3) return document.createTextNode(n.nodeValue);
      if (n.nodeType !== 1) return null;
      const name = n.localName.toLowerCase();
      if (name === "style") {
        let rules = function(items) {
          for (const rule of items) {
            if (rule.type === 1 && rule.selectorText.length < 500 && !/[<>@]/.test(rule.selectorText)) styles.push(rule.selectorText.replace(/\bbody\b/g, ".uip-import-body") + "{" + filter(rule.style) + "}");
            else if (rule.type === 4 && matchMedia(rule.conditionText).matches) rules(rule.cssRules);
          }
        };
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(n.textContent.slice(0, 2e5));
        rules(sheet.cssRules);
        return null;
      }
      const ns = n.namespaceURI;
      const allowed = ns === SVG ? allowedSvg.has(name) : ns === MATH ? allowedMath.has(name) : allowedHtml.has(name) || ["body", "img", "input", "textarea", "select"].includes(name);
      if (!allowed) return null;
      const el = document.createElementNS(ns, name === "body" ? "div" : n.localName);
      for (const a of n.attributes) {
        if (["class", "id"].includes(a.name) && a.value.length < 200) el.setAttribute(a.name, a.value);
        else if (a.name === "style") el.setAttribute("style", filter(n.style));
        else if (a.name === "src" && name === "img" && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(a.value) && a.value.length < 2e6) {
          const parts = a.value.split(",");
          rasterDimensions(Uint8Array.from(atob(parts[1]), (c) => c.charCodeAt(0)), parts[0].slice(5, -7));
          el.setAttribute("src", a.value);
        } else if ((allowedAttributes.has(a.name) || ["type", "min", "max", "step", "value", "checked", "open", "disabled", "gradientUnits", "gradientTransform", "clipPathUnits"].includes(a.name)) && a.value.length < 1e5 && (["d", "points"].includes(a.name) && !/[<>\\@]|url\s*\(/i.test(a.value) || safeCss(a.value) || /^url\(#[\w-]+\)$/.test(a.value)) && !/[<>]/.test(a.value)) el.setAttribute(a.name, a.value);
      }
      if (name === "body") el.classList.add("uip-import-body");
      if (name === "input" && !["range", "radio", "checkbox"].includes(el.getAttribute("type"))) el.setAttribute("type", "text");
      if (n.hasAttribute("contenteditable")) el.setAttribute("contenteditable", "true");
      for (const c of n.childNodes) {
        const out = clone(c, depth + 1);
        if (out) el.append(out);
      }
      return el;
    }
    const root = type === "svg" ? doc.documentElement : doc.body;
    if (type !== "svg") for (const st of doc.head.querySelectorAll("style")) clone(st);
    const safe = clone(root);
    if (!safe) throw Error("\u6CA1\u6709\u53EF\u5BFC\u5165\u5185\u5BB9");
    const style = document.createElement("style");
    style.textContent = styles.join("\n");
    document.head.append(style);
    return safe;
  }
  window.addEventListener("message", async (event) => {
    if (event.source !== parent || active || !event.data || event.data.type !== "convert") return;
    active = true;
    const { nonce, text: text2, kind, width } = event.data;
    try {
      if (typeof text2 !== "string" || text2.length > 2e6 || !["html", "svg"].includes(kind)) throw Error("\u6587\u4EF6\u8D85\u8FC7 2 MB \u6216\u7C7B\u578B\u4E0D\u652F\u6301");
      document.body.style.cssText = "margin:0;width:" + Math.min(1600, Math.max(320, Number(width) || 1200)) + "px";
      const safe = sanitize(text2, kind);
      document.body.replaceChildren(safe);
      const snapshot = await captureElement(safe, { source: { type: kind, origin: "local" }, method: "local-file" });
      snapshot.omissions.push("\u6587\u4EF6\u4E2D\u7684\u811A\u672C\u3001\u4E8B\u4EF6\u3001\u8FDC\u7A0B\u8D44\u6E90\u4E0E\u4E0D\u652F\u6301\u7684\u6837\u5F0F\u89C4\u5219\u5DF2\u79FB\u9664\uFF1B\u5BFC\u5165\u4E0D\u80FD\u8BC1\u660E\u5185\u5BB9\u6240\u6709\u6743");
      parent.postMessage({ nonce, snapshot }, "*");
    } catch (error) {
      parent.postMessage({ nonce, error: error.message }, "*");
    } finally {
      active = false;
    }
  });
  parent.postMessage({ type: "sandbox-ready" }, "*");
})();
