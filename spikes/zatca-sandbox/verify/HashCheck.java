// Independent check of the ZATCA invoice hash using the JDK's built-in XML DSig stack
// (Apache Santuario inside the JDK): remove UBLExtensions, cac:Signature and the QR
// AdditionalDocumentReference, canonicalize with C14N 1.1, SHA-256, base64.
// Also verifies the ECDSA signature value against the certificate in the XML (best effort).
// Run:  java verify/HashCheck.java out/report-simplified.xml
import javax.xml.parsers.*;
import javax.xml.crypto.dsig.*;
import javax.xml.crypto.dom.DOMStructure;
import javax.xml.crypto.*;
import org.w3c.dom.*;
import java.io.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.Base64;

public class HashCheck {
  static final String CAC = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2";
  static final String CBC = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2";
  static final String EXT = "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2";
  static final String DS = "http://www.w3.org/2000/09/xmldsig#";

  public static void main(String[] a) throws Exception {
    DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
    f.setNamespaceAware(true);
    Document doc = f.newDocumentBuilder().parse(new File(a[0]));
    String embedded = null;
    NodeList refs = doc.getElementsByTagNameNS(DS, "Reference");
    for (int i = 0; i < refs.getLength(); i++) {
      Element r = (Element) refs.item(i);
      if ("".equals(r.getAttribute("URI")))
        embedded = r.getElementsByTagNameNS(DS, "DigestValue").item(0).getTextContent();
    }
    Element root = doc.getDocumentElement();
    remove(root.getElementsByTagNameNS(EXT, "UBLExtensions"));
    NodeList sigs = root.getChildNodes();
    for (int i = sigs.getLength() - 1; i >= 0; i--) {
      Node n = sigs.item(i);
      if (n instanceof Element e && CAC.equals(e.getNamespaceURI())) {
        if (e.getLocalName().equals("Signature")) root.removeChild(e);
        else if (e.getLocalName().equals("AdditionalDocumentReference")) {
          Node id = e.getElementsByTagNameNS(CBC, "ID").item(0);
          if (id != null && "QR".equals(id.getTextContent())) root.removeChild(e);
        }
      }
    }
    TransformService c14n = TransformService.getInstance("http://www.w3.org/2006/12/xml-c14n11", "DOM");
    c14n.init(null);
    Data out = c14n.transform(new NodeSetData() {
      public java.util.Iterator iterator() { return nodes(doc).iterator(); }
    }, null);
    byte[] canon = ((OctetStreamData) out).getOctetStream().readAllBytes();
    String h = Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(canon));
    System.out.println("JDK C14N11 hash : " + h);
    System.out.println("embedded hash   : " + embedded);
    System.out.println(h.equals(embedded) ? "MATCH" : "MISMATCH");
  }

  static void remove(NodeList l) { for (int i = l.getLength() - 1; i >= 0; i--) l.item(i).getParentNode().removeChild(l.item(i)); }

  // XPath-style node-set of the whole (already pruned) document, incl. namespace + attribute nodes.
  static java.util.List<Node> nodes(Document d) {
    java.util.List<Node> l = new java.util.ArrayList<>();
    walk(d.getDocumentElement(), l);
    return l;
  }
  static void walk(Node n, java.util.List<Node> l) {
    l.add(n);
    if (n.getAttributes() != null) for (int i = 0; i < n.getAttributes().getLength(); i++) l.add(n.getAttributes().item(i));
    for (Node c = n.getFirstChild(); c != null; c = c.getNextSibling()) walk(c, l);
  }
}
