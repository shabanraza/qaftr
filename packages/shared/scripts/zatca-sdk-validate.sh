#!/usr/bin/env bash
# Validates documents built + signed by src/zatca-phase2 with the OFFICIAL ZATCA SDK
# (`fatoora -validate`). The SDK is not bundled (no open-source license): download it
# from the ZATCA developer portal and point ZATCA_SDK_DIR at the unzipped folder.
#
#   ZATCA_SDK_DIR=/path/to/zatca-einvoicing-sdk-Java-238-R3.4.8 \
#   JAVA11_HOME=/path/to/jdk-11 \
#   bun run zatca:sdk-check
#
# Notes (learned the hard way):
# - Needs JDK 11–14: newer JDKs dropped secp256k1, so the SIGNATURE check fails.
# - Forces -Dfile.encoding=UTF-8: on Windows the SDK otherwise reads XML as Cp1252 and
#   reports false hash/QR mismatches for Arabic seller names.
# - Never run the SDK's install.bat: it runs `SETX PATH ""` and wipes the user PATH.
#   This script uses a private config instead (no setx, no PATH changes).
# - The SDK compares X509IssuerName/SerialNumber with its configured certPath, so the
#   test certificate is written in the SDK's header-less base64 format.
set -euo pipefail

: "${ZATCA_SDK_DIR:?set ZATCA_SDK_DIR to the unzipped ZATCA SDK folder}"
: "${JAVA11_HOME:?set JAVA11_HOME to a JDK 11-14 install}"

here="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

to_native() { if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else echo "$1"; fi; }

bun "$here/scripts/zatca-sdk-golden.ts" "$work/docs"

sdk_native="$(to_native "$ZATCA_SDK_DIR")"
cert_native="$(to_native "$work/docs/cert.b64")"
config="$work/sdk-config.json"
SDK="$sdk_native" CERT="$cert_native" bun -e '
const { join } = require("node:path");
const sdk = process.env.SDK, j = (...p) => join(sdk, ...p);
const cfg = {
  xsdPath: j("Data","Schemas","xsds","UBL2.1","xsd","maindoc","UBL-Invoice-2.1.xsd"),
  enSchematron: j("Data","Rules","schematrons","CEN-EN16931-UBL.xsl"),
  zatcaSchematron: j("Data","Rules","schematrons","20210819_ZATCA_E-invoice_Validation_Rules.xsl"),
  certPath: process.env.CERT,
  privateKeyPath: j("Data","Certificates","ec-secp256k1-priv-key.pem"),
  pihPath: j("Data","PIH","pih.txt"),
  inputPath: j("Data","Input"),
  usagePathFile: j("Configuration","usage.txt"),
};
require("node:fs").writeFileSync(process.argv[1], JSON.stringify(cfg));
' "$config"

export SDK_CONFIG="$(to_native "$config")"
jar="$(ls "$ZATCA_SDK_DIR"/Apps/zatca-einvoicing-sdk-*.jar | head -1)"
version="$(basename "$jar" .jar | sed 's/^zatca-einvoicing-sdk-//')"

failed=0
for doc in "$work"/docs/*.xml; do
  name="$(basename "$doc")"
  result="$(cd "$ZATCA_SDK_DIR/Apps" && "$JAVA11_HOME/bin/java" \
    -Djdk.module.illegalAccess=deny -Djdk.sunec.disableNative=false -Dfile.encoding=UTF-8 \
    -jar "$(to_native "$jar")" --globalVersion "$version" -validate -invoice "$(to_native "$doc")" 2>&1 || true)"
  echo "$result" | grep -E "validation result|CODE :|GLOBAL" | sed 's/^.*ValidationProcessorImpl - /  /;s/^.*InvoiceValidationService - /  /' | grep -v "BR-KSA-98" || true
  if echo "$result" | grep -q "GLOBAL VALIDATION RESULT = PASSED"; then
    echo "PASS $name"
  else
    echo "FAIL $name"; failed=1
  fi
done
exit "$failed"
