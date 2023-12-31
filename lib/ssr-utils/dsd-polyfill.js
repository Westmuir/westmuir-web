(() => {
  // node_modules/@webcomponents/template-shadowroot/_implementation/feature_detect.js
  var hasNative;
  function hasNativeDeclarativeShadowRoots() {
    var _a;
    if (hasNative === void 0) {
      const html = `<div><template shadowrootmode="open"></template></div>`;
      const fragment = new DOMParser().parseFromString(html, "text/html", {
        includeShadowRoots: true
      });
      hasNative = !!((_a = fragment.querySelector("div")) === null || _a === void 0 ? void 0 : _a.shadowRoot);
    }
    return hasNative;
  }

  // node_modules/@webcomponents/template-shadowroot/_implementation/util.js
  var hasNoParentElement = (e) => e.parentElement === null;
  var isTemplate = (e) => e.tagName === "TEMPLATE";
  var isElement = (e) => e.nodeType === Node.ELEMENT_NODE;

  // node_modules/@webcomponents/template-shadowroot/_implementation/manual_walk.js
  var hydrateShadowRoots = (root) => {
    var _a;
    if (hasNativeDeclarativeShadowRoots()) {
      return;
    }
    const templateStack = [];
    let currentNode = root.firstElementChild;
    while (currentNode !== root && currentNode !== null) {
      if (isTemplate(currentNode)) {
        templateStack.push(currentNode);
        currentNode = currentNode.content;
      } else if (currentNode.firstElementChild !== null) {
        currentNode = currentNode.firstElementChild;
      } else if (isElement(currentNode) && currentNode.nextElementSibling !== null) {
        currentNode = currentNode.nextElementSibling;
      } else {
        let template;
        while (currentNode !== root && currentNode !== null) {
          if (hasNoParentElement(currentNode)) {
            template = templateStack.pop();
            const host = template.parentElement;
            const mode = template.getAttribute("shadowrootmode");
            currentNode = template;
            if (mode === "open" || mode === "closed") {
              const delegatesFocus = template.hasAttribute("shadowrootdelegatesfocus");
              try {
                const shadow = host.attachShadow({ mode, delegatesFocus });
                shadow.append(template.content);
              } catch {
              }
            } else {
              template = void 0;
            }
          } else {
            const nextSibling = currentNode.nextElementSibling;
            if (nextSibling != null) {
              currentNode = nextSibling;
              if (template !== void 0) {
                template.parentElement.removeChild(template);
              }
              break;
            }
            const nextAunt = (_a = currentNode.parentElement) === null || _a === void 0 ? void 0 : _a.nextElementSibling;
            if (nextAunt != null) {
              currentNode = nextAunt;
              if (template !== void 0) {
                template.parentElement.removeChild(template);
              }
              break;
            }
            currentNode = currentNode.parentElement;
            if (template !== void 0) {
              template.parentElement.removeChild(template);
              template = void 0;
            }
          }
        }
      }
    }
  };

  // stuff/ssr-utils/dsd-polyfill.js
  if (!HTMLTemplateElement.prototype.hasOwnProperty("shadowRoot")) {
    hydrateShadowRoots(document.body);
  }
  document.body.removeAttribute("dsd-pending");
})();
/*! Bundled license information:

@webcomponents/template-shadowroot/_implementation/feature_detect.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@webcomponents/template-shadowroot/_implementation/util.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@webcomponents/template-shadowroot/_implementation/manual_walk.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@webcomponents/template-shadowroot/_implementation/default_implementation.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@webcomponents/template-shadowroot/template-shadowroot.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=dsd-polyfill.js.map
