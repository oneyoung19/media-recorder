export const getSecureOrigin = function () {
  // window.isSecureContext could be used for Chrome
  const isSecureOrigin = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  return isSecureOrigin
}

export const getSupportedTypes = function () {
  // const audioTypes = [
  //   'audio/webm',
  //   'audio/webm;codecs=opus',
  // ]
  const videoTypes = [
    // chrome/firefox
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    // mobile ios
    'video/mp4',
    // other
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/webm;codecs=daala',
    'video/webm;codecs=h264',
    'video/mpeg'
  ]
  return videoTypes.filter(item => {
    return MediaRecorder.isTypeSupported(item)
  })
}

export const transformDataURLtoFile = function (dataurl, filename) {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}
