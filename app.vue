<template>
  <div>
    <NuxtRouteAnnouncer />
    Progress: {{ progress }}<br />
    <input ref="inputUpload" type="file" /><br />
    <button @click="go">Upload</button><br />
    CID: <a :href="'/ipfs/' + cid" target="_blank">{{ cid }}</a>
  </div>
</template>

<script lang="ts" setup>
import * as tus from 'tus-js-client'

const inputUpload = ref<HTMLInputElement | null>(null)
const progress = ref('0')
const cid = ref<string | undefined>('')

async function go() {
  const file = inputUpload.value?.files?.[0]
  if (!file) {
    return
  }

  const upload = new tus.Upload(file, {
    endpoint: '/uploads',
    retryDelays: [0, 3000, 5000, 10000, 20000],
    metadata: {
      filename: file.name,
      filetype: file.type,
    },
    // Callback for errors which cannot be fixed using retries
    onError: function (error) {
      console.log('Failed because: ' + error)
    },
    // Callback for reporting upload progress
    onProgress: function (bytesUploaded, bytesTotal) {
      var percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
      console.log(bytesUploaded, bytesTotal, percentage + '%')
      progress.value = percentage
    },
    // Callback for once the upload is completed
    onSuccess: function ({ lastResponse }) {
      const _cid = lastResponse.getHeader('Cid')
      const location = lastResponse.getHeader('Location')
      const size = lastResponse.getHeader('Upload-Length')
      console.log('Cid', _cid)
      console.log('Location', location)
      console.log('Size', size)
      console.log('Download %s from %s', (upload.file as File).name, `${location}`)
      cid.value = _cid
    },
  })

  upload.start()
}
</script>