
import defaults from './defaults.js'
import { getSecureOrigin, getSupportedTypes, transformDataURLtoFile } from './helpers.js'
import rejectError from './error.js'

function merge(...sources/* obj1, obj2, obj3, ... */) {
  const result = {}
  const isPlainObject = value => {
    return Object.prototype.toString.call(value).slice(8, -1).toLowerCase() === 'object'
  }

  const assignValue = (val, key) => {
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val)
    } else if (isPlainObject(val)) {
      result[key] = merge({}, val)
    } else if (Array.isArray(val)) {
      result[key] = val.slice()
    } else {
      result[key] = val
    }
  }

  sources.forEach(object => {
    if (object) {
      const keys = Object.keys(object)
      for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i]
        const val = object[key]
        assignValue.call(null, val, key)
      }
    }
  })
  
  return result
}

class Media {
  // 摄像 视频录制 拍照
  constructor (options = {}) {
    this.defaults = defaults
    this.isSecureOrigin = getSecureOrigin()
    this.stream = null
    this.mediaRecorder = null
    this.recordedBlobs = []
    // 创建
    this.create(options)
  }

  create ({ mediaVideo, recordVideo, config = {} }) {
    this.mediaVideo = mediaVideo
    this.recordVideo = recordVideo
    this.config = merge(this.defaults, config)
  }

  // 是否支持摄像
  getMediaAuth ({ video = true, audio = true } = {}) {
    if (!this.isSecureOrigin) {
      return Promise.reject(rejectError('NOT_SECURE'))
    }
    /*
      如果执行环境不安全 则 navigator.mediaDevices 也会为 undefined.
      但上一步已经限制，因此该情况用以判断 浏览器版本过低
    */
    if (!navigator.mediaDevices) {
      return Promise.reject(rejectError('NOT_SUPPORT'))
    }
    return navigator.mediaDevices.getUserMedia({
      video,
      audio
    }).then(stream => {
      // MediaStream 实例
      return stream
    }, error => {
      // 没有授权的话 DOMException: Permission denied
      console.error(error)
      return Promise.reject(rejectError('NOT_PERMISSION'))
    })
  }

  // 开启摄像
  open () {
    const { video = true, audio = true } = this.config
    return this.getMediaAuth({
      video,
      audio
    }).then(stream => {
      this.stream = stream
      this.mediaVideo && (this.mediaVideo.srcObject = stream)
      return stream
    }).catch(err => {
      console.error(err)
      return Promise.reject(err)
    })
  }

  // 关闭摄像头
  close () {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop && track.stop()
      })
    }
  }

  /* 视频录制 */
  getRecorderAuth () {
    return window.MediaRecorder && (getSupportedTypes().length > 0)
  }

  getMediaRecorder (stream, options) {
    return new Promise((resolve, reject) => {
      try {
        const mediaRecorder = new MediaRecorder(stream, options)
        resolve(mediaRecorder)
      } catch (e) {
        reject(e)
        console.error(e)
      }
    })
  }

  async startVideo () {
    if (!this.getRecorderAuth()) {
      return Promise.reject(rejectError('NOT_SUPPORT'))
    }
    this.recordedBlobs = []
    const supportTypes = getSupportedTypes()
    const configList = supportTypes.map(mimeType => {
      return {
        mimeType,
        bitsPerSecond: 100000
      }
    })
    // 遍历
    for (let i = 0; i < configList.length; i++) {
      const config = configList[i]
      try {
        this.mediaRecorder = await this.getMediaRecorder(this.stream, config)
        break
      } catch (e) {
        console.error(e)
        continue
      }
    }
    if (!this.mediaRecorder) {
      try {
        this.mediaRecorder = await this.getMediaRecorder(this.stream)
      } catch (err) {
        console.error(err)
        return Promise.reject(rejectError('NOT_SUPPORT'))
      }
    }
    this.mediaRecorder.onstop = event => {
      console.log('Recorder stopped: ', event)
      console.log('Recorded Blobs: ', this.recordedBlobs)
    }
    this.mediaRecorder.ondataavailable = event => {
      if (event.data && event.data.size > 0) {
        this.recordedBlobs.push(event.data)
      }
    }
    this.mediaRecorder.start(10) // collect 10ms of data
  }

  stopVideo () {
    this.mediaRecorder.stop()
    this.recordVideo && (this.recordVideo.controls = true)
  }

  playVideo () {
    const type = (this.recordedBlobs[0] || {}).type
    console.log('type is:', type)
    const superBuffer = new Blob(this.recordedBlobs, { type })
    const blobUrl = window.URL.createObjectURL(superBuffer)
    if (this.recordVideo) {
      this.recordVideo.src = blobUrl
    }
    return {
      blobUrl
    }
  }

  downloadVideo () {
    const blob = new Blob(this.recordedBlobs, {
      type: 'video/webm'
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = 'video.webm'
    document.body.appendChild(a)
    a.click()
    setTimeout(function () {
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }, 100)
  }

  /* 拍照 */
  takePhoto ({ canvas = document.createElement('canvas'), filename = 'photo.png', ratio = 3 }) {
    if (!this.mediaVideo) {
      return
    }
    const { width, height } = this.getRectWithAspectRatio()
    const ratioWidth = width * ratio
    const ratioHeight = height * ratio
    canvas.width = ratioWidth
    canvas.height = ratioHeight
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const context = canvas.getContext('2d')
    // canvas镜像成像
    context.translate(ratioWidth / 2, ratioHeight / 2)
    context.scale(-1, 1)
    context.drawImage(this.mediaVideo, -ratioWidth / 2, -ratioHeight / 2, ratioWidth, ratioHeight)
    // 获取图片base64链接
    const dataUrl = canvas.toDataURL('image/png')
    const file = transformDataURLtoFile(dataUrl, filename)
    return {
      dataUrl,
      file
    }
  }

  getRectWithAspectRatio (element) {
    const { offsetWidth, offsetHeight } = element || this.mediaVideo
    const { aspectRatio = 4 / 3 } = this.config.video || {}
    /*
      假设video元素的宽和高为 480/360，那么当 aspectRatio 为 4/3 和 1/1 时，计算的播放宽和高为 480/360 和 360/360。都没有超出video元素边界。
      但当 aspectRatio 为 16/9 时，计算的播放宽和高为 640/360。超出了video元素边界。
      此时，应该以宽度为基准。
    */
    let width, height
    if (aspectRatio <= 4 / 3) {
      width = offsetHeight * aspectRatio
      height = offsetHeight
    } else {
      width = offsetWidth
      height = offsetWidth / aspectRatio
    }
    return {
      width,
      height
    }
  }
}

export default Media
