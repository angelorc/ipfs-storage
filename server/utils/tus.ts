import { resolve } from "node:path"
import { nanoid } from "nanoid"
import { DataStore, Server, ServerOptions, WithOptional } from "@tus/server"
import { FileStore } from "@tus/file-store"
import { H3Event } from 'h3'
import { createReadStream } from "node:fs"
import { create } from "kubo-rpc-client"

export const xProtoKey = "x-forwarded-proto"
export const isXProtoHeaderValid = (value: string) => /^https?/i.test(value)

export const defaultTusOptions: WithOptional<ServerOptions, "locker"> & {
  datastore: DataStore;
} & {
  allowedMethods?: Methods[];
} = {
  allowedMethods: ["POST", "PATCH", "HEAD", "OPTIONS"],
  path: "/uploads",
  respectForwardedHeaders: true,
  allowedHeaders: ['Authorization', 'X-Upsert', 'Upload-Expires', 'ApiKey', 'x-signature'],
  namingFunction: () => nanoid(32),
  maxSize: 1024 * 1024 * 1024 * 1, // 1GB
  datastore: new FileStore({
    directory: resolve("uploads")
  }),
  onUploadCreate: async (req, res, upload) => {
    console.log("Upload created", upload.id);
    return res
  },
  onUploadFinish: async (req, res, upload) => {
    const client = create({ url: `${useRuntimeConfig().ipfs.api}/api/v0` })
    const { cid, size } = await client.add(createReadStream(upload.storage!.path), {
      chunker: "size-262144",
      cidVersion: 0,
      pin: false
    })

    res.setHeader('Cid', cid.toV0().toString());
    res.setHeader("Location", `/ipfs/${cid}`);
    res.setHeader("Upload-Length", size.toString());

    return res
  },
  onResponseError: async (req, res, err) => {
    console.error("Error", err);
    return { status_code: 500, body: "Internal Server Error" }
  }
}

type Methods = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS"
type TusEventHandlerOptions = WithOptional<ServerOptions, "locker"> & {
  datastore: DataStore;
} & {
  allowedMethods?: Methods[];
}

// Example: /routes/uploads/[...pathname].ts
// export default defineTusEventHandler({
//   path: "/uploads",
//   datastore: new FileStore({
//     directory: '.tmp/uploads'
//   }),
//   onUploadCreate: async (req, res, upload) => {
//     console.log("Upload created", upload.id);
//     return res
//   },
//   onUploadFinish: async (req, res, upload) => {
//     console.log("Upload finished", upload.id);
//     return res
//   }
// })
export function defineTusEventHandler(options: TusEventHandlerOptions) {
  const tus = new Server(options)

  return eventHandler(async (event: H3Event) => {
    const { req, res } = event.node

    if (options.allowedMethods && !options.allowedMethods.includes(req.method as Methods)) {
      throw createError({ statusCode: 405, message: "Method Not Allowed" })
    }

    // Remove once this issue is resolved:
    // Thanks to https://github.com/twi-dev/twi/blob/7dd744c4af972d2475296a5c51221bbd0bd7620e/server/lib/uploads/handler.ts#L10
    const { headers } = req
    const xProto = headers[xProtoKey]
    if (xProto && !isXProtoHeaderValid(String(xProto))) {
      delete req.headers[xProtoKey]
    }

    return tus.handle(req, res)
  })
}