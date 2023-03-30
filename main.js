import Media from './media/index.js'
const mediaVideoElement = document.querySelector('#mediaVideo')
const recordVideoElement = document.querySelector('#recordVideo')
const media = new Media({
  mediaVideo: mediaVideoElement,
  recordVideo: recordVideoElement
})
media.open()

const recordButton = document.querySelector('#record-btn')
const stopButton = document.querySelector('#stop-btn')
const playButton = document.querySelector('#play-btn')
const downloadButton = document.querySelector('#download-btn')
const imgButton = document.querySelector('#base64-btn')
const closeButton = document.querySelector('#close')

recordButton.addEventListener('click', media.startVideo.bind(media))
stopButton.addEventListener('click', media.stopVideo.bind(media))
playButton.addEventListener('click', media.playVideo.bind(media))
downloadButton.addEventListener('click', media.downloadVideo.bind(media))
imgButton.addEventListener('click', () => {
  console.log(media.takePhoto())
})
closeButton.addEventListener('click', media.close.bind(media))
