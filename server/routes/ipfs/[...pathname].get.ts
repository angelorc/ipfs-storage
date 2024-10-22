export default defineEventHandler(async (event) => {
  return proxyRequest(
    event,
    `${useRuntimeConfig().ipfs.gateway}/ipfs/${getRouterParam(event, "pathname")}`
  )
})