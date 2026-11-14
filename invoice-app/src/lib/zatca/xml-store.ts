/** Signed/cleared invoice XML in R2 (binding ZATCA_XML). Server-only. */
export interface XmlStore {
  put(key: string, xml: string): Promise<void>
  get(key: string): Promise<string | null>
}

interface R2Like {
  put(key: string, value: string, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>
  get(key: string): Promise<{ text(): Promise<string> } | null>
}

export async function r2XmlStore(): Promise<XmlStore> {
  const { env } = await import('cloudflare:workers')
  const bucket = env.ZATCA_XML as R2Like | undefined
  if (!bucket) throw new Error('ZATCA_XML binding is missing')
  return {
    async put(key, xml) {
      await bucket.put(key, xml, { httpMetadata: { contentType: 'application/xml; charset=utf-8' } })
    },
    async get(key) {
      const obj = await bucket.get(key)
      return obj ? obj.text() : null
    },
  }
}
