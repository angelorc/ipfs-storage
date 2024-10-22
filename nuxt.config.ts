// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  runtimeConfig: {
    ipfs: {
      gateway: 'http://localhost:8080',
      api: 'http://localhost:5001',
    },
    ipx: {
      domains: ['localhost', 'ipfs'],
    }
  }
})
