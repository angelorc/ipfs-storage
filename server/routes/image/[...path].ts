import { createIPX, ipxFSStorage, ipxHttpStorage, createIPXH3Handler, } from "ipx";

export default lazyEventHandler(() => {
  const ipx = createIPX({
    maxAge: 60 * 60 * 24 * 365,
    alias: {
      '/ipfs': `${useRuntimeConfig().ipfs.gateway}/ipfs`,
    },
    storage: ipxFSStorage({ dir: "./public" }),
    httpStorage: ipxHttpStorage({ domains: useRuntimeConfig().ipx.domains }),
  });

  return useBase('/image', createIPXH3Handler(ipx));
})