import { describe, expect, it } from "bun:test";
import { canonicalize, escapeAttr, escapeText, parseXml } from "./xml";

describe("escapeText / escapeAttr (C14N escaping rules)", () => {
  it("escapes text per C14N: & < > and CR", () => {
    expect(escapeText(`a & b < c > d\r"'`)).toBe(`a &amp; b &lt; c &gt; d&#xD;"'`);
  });
  it("escapes attributes per C14N: & < \" TAB LF CR (not >)", () => {
    expect(escapeAttr(`a&b<c>"d\t\n\r'`)).toBe(`a&amp;b&lt;c>&quot;d&#x9;&#xA;&#xD;'`);
  });
});

describe("parseXml", () => {
  it("parses elements, attributes, text, CDATA and entities", () => {
    const doc = parseXml(
      `<?xml version="1.0" encoding="UTF-8"?><a x="1&amp;2"><b>t &lt; &#x41;&#66;</b><![CDATA[<raw>]]></a>`,
    );
    const root = doc.root;
    expect(root.name).toBe("a");
    expect(root.attributes).toEqual([{ name: "x", value: "1&2" }]);
    const b = root.children[0];
    expect(b?.type).toBe("element");
    if (b?.type !== "element") throw new Error("expected element");
    expect(b.children[0]).toEqual({ type: "text", value: "t < AB" });
    expect(root.children[1]).toEqual({ type: "text", value: "<raw>" });
  });

  it("rejects mismatched tags and DOCTYPE (no DTD processing)", () => {
    expect(() => parseXml("<a><b></a>")).toThrow();
    expect(() => parseXml(`<!DOCTYPE a [<!ENTITY x "y">]><a/>`)).toThrow();
  });
});

describe("canonicalize (C14N 1.1, without comments)", () => {
  it("drops the XML declaration and comments, expands empty elements", () => {
    const out = canonicalize(`<?xml version="1.0"?>\n<!-- c --><a><b/><!-- x --></a>`);
    expect(out).toBe("<a><b></b></a>");
  });

  it("sorts namespace declarations first (by prefix), then attributes by (ns URI, local name)", () => {
    const out = canonicalize(
      `<a z="1" xmlns:b="urn:b" b:y="2" xmlns="urn:d" a="3" xmlns:a="urn:a" a:x="4"></a>`,
    );
    expect(out).toBe(
      `<a xmlns="urn:d" xmlns:a="urn:a" xmlns:b="urn:b" a="3" z="1" a:x="4" b:y="2"></a>`,
    );
  });

  it("removes redundant namespace re-declarations but keeps changed ones", () => {
    const out = canonicalize(
      `<r xmlns:p="urn:p"><p:c xmlns:p="urn:p"><p:d xmlns:p="urn:q"></p:d></p:c></r>`,
    );
    expect(out).toBe(`<r xmlns:p="urn:p"><p:c><p:d xmlns:p="urn:q"></p:d></p:c></r>`);
  });

  it("normalises CRLF to LF and attribute whitespace to spaces, re-escaping char refs", () => {
    const out = canonicalize(`<a v="x\ty&#9;z">l1\r\nl2&#13;</a>`);
    expect(out).toBe(`<a v="x y&#x9;z">l1\nl2&#xD;</a>`);
  });

  it("removes nodes matched by an exclusion predicate (subtree), keeping surrounding text", () => {
    const out = canonicalize(`<a>\n  <x><y/></x>\n  <b>k</b></a>`, {
      exclude: (el) => el.localName === "x",
    });
    expect(out).toBe(`<a>\n  \n  <b>k</b></a>`);
  });
});
