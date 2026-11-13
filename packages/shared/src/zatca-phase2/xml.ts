/**
 * Minimal, dependency-free XML parser + Canonical XML 1.1 serializer
 * (http://www.w3.org/2006/12/xml-c14n11, comments omitted).
 *
 * Why hand-rolled: ZATCA hashing needs only (a) parse a well-formed UBL
 * document, (b) drop three subtrees, (c) serialize canonically. Popular XML
 * libs either depend on Node APIs (xml-crypto, xmldom-based C14N) or are large.
 * Scope limits (intentional, documented): no DTD/DOCTYPE (rejected — this also
 * blocks entity-expansion attacks), no external entities, UTF-8 input only.
 * Because the ZATCA transforms remove whole subtrees, every emitted element's
 * ancestors are also emitted, so inclusive-namespace rendering reduces to
 * "emit a declaration unless the nearest rendered ancestor already has it".
 */

export interface XmlAttribute {
  name: string;
  value: string;
}

export interface XmlElement {
  type: "element";
  name: string;
  attributes: XmlAttribute[];
  children: XmlNode[];
}

export interface XmlText {
  type: "text";
  value: string;
}

export interface XmlComment {
  type: "comment";
  value: string;
}

export interface XmlPi {
  type: "pi";
  target: string;
  data: string;
}

export type XmlNode = XmlElement | XmlText | XmlComment | XmlPi;

export interface XmlDocument {
  /** Comments/PIs before the document element. */
  prolog: XmlNode[];
  root: XmlElement;
  /** Comments/PIs after the document element. */
  epilog: XmlNode[];
}

/** Element view handed to exclusion predicates (namespace-resolved). */
export interface ElementInfo {
  element: XmlElement;
  prefix: string;
  localName: string;
  namespaceURI: string;
}

export interface CanonicalizeOptions {
  /** Return true to drop the element and its whole subtree. */
  exclude?: (info: ElementInfo) => boolean;
}

export const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";

// ---------------------------------------------------------------- escaping

export function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r/g, "&#xD;");
}

export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/\t/g, "&#x9;")
    .replace(/\n/g, "&#xA;")
    .replace(/\r/g, "&#xD;");
}

// ---------------------------------------------------------------- parsing

const NAME_RE = /^[A-Za-z_À-￿][\w.\-:·À-￿]*/;

function decodeEntities(raw: string, at: number): string {
  return raw.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[A-Za-z]+);|&/g, (match, ref: string | undefined) => {
    if (!ref) throw new Error(`XML: bare '&' near offset ${at}`);
    switch (ref) {
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "amp":
        return "&";
      case "quot":
        return '"';
      case "apos":
        return "'";
    }
    if (ref.startsWith("#x")) return String.fromCodePoint(parseInt(ref.slice(2), 16));
    if (ref.startsWith("#")) return String.fromCodePoint(parseInt(ref.slice(1), 10));
    throw new Error(`XML: unknown entity ${match} near offset ${at}`);
  });
}

export function parseXml(input: string): XmlDocument {
  // XML 1.0 §2.11 end-of-line handling.
  const src = input.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const prolog: XmlNode[] = [];
  const epilog: XmlNode[] = [];
  const stack: XmlElement[] = [];
  let root: XmlElement | undefined;
  let i = 0;

  const pushNode = (node: XmlNode) => {
    const parent = stack[stack.length - 1];
    if (parent) parent.children.push(node);
    else if (node.type === "text") {
      if (node.value.trim() !== "") throw new Error(`XML: text outside root at ${i}`);
    } else if (node.type === "element") {
      if (root) throw new Error("XML: multiple root elements");
      root = node;
    } else (root ? epilog : prolog).push(node);
  };

  while (i < src.length) {
    if (src[i] !== "<") {
      const end = src.indexOf("<", i);
      const raw = src.slice(i, end === -1 ? src.length : end);
      pushNode({ type: "text", value: decodeEntities(raw, i) });
      i = end === -1 ? src.length : end;
      continue;
    }
    if (src.startsWith("<!--", i)) {
      const end = src.indexOf("-->", i + 4);
      if (end === -1) throw new Error("XML: unterminated comment");
      pushNode({ type: "comment", value: src.slice(i + 4, end) });
      i = end + 3;
      continue;
    }
    if (src.startsWith("<![CDATA[", i)) {
      const end = src.indexOf("]]>", i + 9);
      if (end === -1 || stack.length === 0) throw new Error("XML: bad CDATA section");
      pushNode({ type: "text", value: src.slice(i + 9, end) });
      i = end + 3;
      continue;
    }
    if (src.startsWith("<!", i)) throw new Error("XML: DOCTYPE/DTD is not supported");
    if (src.startsWith("<?", i)) {
      const end = src.indexOf("?>", i + 2);
      if (end === -1) throw new Error("XML: unterminated processing instruction");
      const body = src.slice(i + 2, end);
      const m = /^(\S+)\s*([\s\S]*)$/.exec(body);
      const target = m?.[1] ?? "";
      if (target.toLowerCase() !== "xml") pushNode({ type: "pi", target, data: m?.[2] ?? "" });
      i = end + 2;
      continue;
    }
    if (src[i + 1] === "/") {
      const end = src.indexOf(">", i);
      const name = src.slice(i + 2, end).trim();
      const open = stack.pop();
      if (!open || open.name !== name) throw new Error(`XML: mismatched </${name}> at ${i}`);
      if (stack.length === 0) pushNode(open);
      i = end + 1;
      continue;
    }
    // Start tag.
    i += 1;
    const nameMatch = NAME_RE.exec(src.slice(i, i + 256));
    if (!nameMatch) throw new Error(`XML: invalid tag name at ${i}`);
    const element: XmlElement = { type: "element", name: nameMatch[0], attributes: [], children: [] };
    i += nameMatch[0].length;
    for (;;) {
      while (/\s/.test(src[i] ?? "")) i++;
      const c = src[i];
      if (c === undefined) throw new Error("XML: unexpected end in start tag");
      if (c === ">" || (c === "/" && src[i + 1] === ">")) {
        const selfClosing = c === "/";
        i += selfClosing ? 2 : 1;
        const parent = stack[stack.length - 1];
        if (selfClosing) {
          if (parent) parent.children.push(element);
          else pushNode(element);
        } else {
          if (parent) parent.children.push(element);
          stack.push(element);
        }
        break;
      }
      const attrName = NAME_RE.exec(src.slice(i, i + 256));
      if (!attrName) throw new Error(`XML: invalid attribute at ${i}`);
      i += attrName[0].length;
      while (/\s/.test(src[i] ?? "")) i++;
      if (src[i] !== "=") throw new Error(`XML: expected '=' at ${i}`);
      i++;
      while (/\s/.test(src[i] ?? "")) i++;
      const quote = src[i];
      if (quote !== '"' && quote !== "'") throw new Error(`XML: expected quote at ${i}`);
      const end = src.indexOf(quote, i + 1);
      if (end === -1) throw new Error("XML: unterminated attribute value");
      const raw = src.slice(i + 1, end);
      if (raw.includes("<")) throw new Error(`XML: '<' in attribute value at ${i}`);
      // Attribute-value normalisation (CDATA type): literal whitespace -> space.
      const value = decodeEntities(raw.replace(/[\t\n]/g, " "), i);
      if (element.attributes.some((a) => a.name === attrName[0])) {
        throw new Error(`XML: duplicate attribute ${attrName[0]}`);
      }
      element.attributes.push({ name: attrName[0], value });
      i = end + 1;
    }
  }
  if (stack.length) throw new Error(`XML: unclosed <${stack[stack.length - 1]?.name}>`);
  if (!root) throw new Error("XML: no root element");
  // Elements nested in the root were pushed onto parents directly; when the
  // root closes it was pushed via pushNode. Self-closing roots are handled too.
  return { prolog, root, epilog };
}

// ---------------------------------------------------------------- querying

/**
 * All elements reached by a slash-separated path of qualified names, matched
 * literally against child element names (e.g. "cac:Party/cbc:Name").
 */
export function findAll(element: XmlElement, path: string): XmlElement[] {
  let current: XmlElement[] = [element];
  for (const step of path.split("/")) {
    const next: XmlElement[] = [];
    for (const el of current) {
      for (const c of el.children) if (c.type === "element" && c.name === step) next.push(c);
    }
    current = next;
  }
  return current;
}

export function findFirst(element: XmlElement, path: string): XmlElement | undefined {
  return findAll(element, path)[0];
}

export function textContent(element: XmlElement): string {
  let out = "";
  for (const c of element.children) {
    if (c.type === "text") out += c.value;
    else if (c.type === "element") out += textContent(c);
  }
  return out;
}

export function textAt(element: XmlElement, path: string): string | undefined {
  const el = findFirst(element, path);
  return el ? textContent(el) : undefined;
}

/** Depth-first search by qualified name anywhere below `element`. */
export function findDescendant(element: XmlElement, name: string): XmlElement | undefined {
  for (const c of element.children) {
    if (c.type !== "element") continue;
    if (c.name === name) return c;
    const hit = findDescendant(c, name);
    if (hit) return hit;
  }
  return undefined;
}

// ---------------------------------------------------------------- namespaces

function splitName(name: string): [prefix: string, local: string] {
  const idx = name.indexOf(":");
  return idx === -1 ? ["", name] : [name.slice(0, idx), name.slice(idx + 1)];
}

type Scope = ReadonlyMap<string, string>;

function extendScope(element: XmlElement, scope: Scope): Map<string, string> {
  const next = new Map(scope);
  for (const a of element.attributes) {
    if (a.name === "xmlns") next.set("", a.value);
    else if (a.name.startsWith("xmlns:")) next.set(a.name.slice(6), a.value);
  }
  return next;
}

function resolve(prefix: string, scope: Scope): string {
  if (prefix === "xml") return XML_NAMESPACE;
  const uri = scope.get(prefix);
  if (uri === undefined && prefix !== "") throw new Error(`XML: undeclared prefix '${prefix}'`);
  return uri ?? "";
}

/** Walks the tree with resolved namespace info (used by callers that query). */
export function elementInfo(element: XmlElement, scope: Scope): ElementInfo {
  const [prefix, localName] = splitName(element.name);
  return { element, prefix, localName, namespaceURI: resolve(prefix, scope) };
}

// ---------------------------------------------------------------- C14N 1.1

function renderPi(node: XmlPi): string {
  return node.data ? `<?${node.target} ${node.data}?>` : `<?${node.target}?>`;
}

function renderElement(
  element: XmlElement,
  parentScope: Scope,
  rendered: Scope,
  options: CanonicalizeOptions,
  out: string[],
): void {
  const scope = extendScope(element, parentScope);
  const info = elementInfo(element, scope);
  if (options.exclude?.(info)) return;

  const nsDecls: Array<[string, string]> = [];
  const attrs: Array<{ uri: string; local: string; name: string; value: string }> = [];
  const nextRendered = new Map(rendered);
  for (const a of element.attributes) {
    if (a.name === "xmlns" || a.name.startsWith("xmlns:")) {
      const prefix = a.name === "xmlns" ? "" : a.name.slice(6);
      const current = rendered.get(prefix) ?? "";
      if (current !== a.value) {
        nsDecls.push([prefix, a.value]);
        nextRendered.set(prefix, a.value);
      }
      continue;
    }
    const [p, local] = splitName(a.name);
    attrs.push({ uri: p === "" ? "" : resolve(p, scope), local, name: a.name, value: a.value });
  }
  nsDecls.sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0));
  attrs.sort((x, y) =>
    x.uri !== y.uri ? (x.uri < y.uri ? -1 : 1) : x.local < y.local ? -1 : x.local > y.local ? 1 : 0,
  );

  let tag = `<${element.name}`;
  for (const [prefix, uri] of nsDecls) {
    tag += prefix === "" ? ` xmlns="${escapeAttr(uri)}"` : ` xmlns:${prefix}="${escapeAttr(uri)}"`;
  }
  for (const a of attrs) tag += ` ${a.name}="${escapeAttr(a.value)}"`;
  out.push(tag + ">");

  for (const child of element.children) {
    if (child.type === "element") renderElement(child, scope, nextRendered, options, out);
    else if (child.type === "text") out.push(escapeText(child.value));
    else if (child.type === "pi") out.push(renderPi(child));
    // comments are dropped (c14n11 without comments)
  }
  out.push(`</${element.name}>`);
}

export function canonicalizeDocument(doc: XmlDocument, options: CanonicalizeOptions = {}): string {
  const out: string[] = [];
  for (const node of doc.prolog) if (node.type === "pi") out.push(renderPi(node), "\n");
  renderElement(doc.root, new Map(), new Map(), options, out);
  for (const node of doc.epilog) if (node.type === "pi") out.push("\n", renderPi(node));
  return out.join("");
}

export function canonicalize(xml: string, options: CanonicalizeOptions = {}): string {
  return canonicalizeDocument(parseXml(xml), options);
}
