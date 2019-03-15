const video = document.getElementById('myvideo')
const canvas = document.getElementById('image-board')
const context = canvas.getContext('2d')
const btn = document.getElementById('btn')
const btn1 = document.getElementById('btn-one')
const btn2 = document.getElementById('btn-two')
const div = document.getElementById('pred')
let one = false
let two = true
video.style.display = 'none'
document.body.style.background = 'tomato'
let isVideo = false

const modelParams = {
  flipHorizontal: true,
  imageScaleFactor: 0.6,
  maxNumBoxes: 3,
  iouThreshold: 0.5,
  scoreThreshold: 0.7
}

let [distx, disty] = [null, null]
let [ox, oy] = [0, 0]
let gestRecorded = true

let distOld = -1
let dif = 0
let gestureCount = 0

let model = null
handTrack.load(modelParams).then(lmodel => {
  // detect objects in the image.
  console.log('Loaded Model!')
  document.body.style.background = 'lightgreen'
  model = lmodel
})

const strtVideo = () => {
  handTrack.startVideo(video).then(function(status) {
    console.log('video started', status)
    if (status) {
      console.log('Video started. Now tracking')
      isVideo = true
      runDetection()
    } else {
      consloe.log('Please enable video')
    }
  })
}

function run() {
  isVideo = !isVideo
  if (isVideo) strtVideo()
}
function runone() {
  one = !one
  two = !one
}
function runtwo() {
  two = !two
  one = !two
}

btn.addEventListener('click', run)
btn1.addEventListener('click', runone)
btn2.addEventListener('click', runtwo)

const getDirection = predictions => {
  const p1x1 = parseInt(predictions[0].bbox[0])
  const p1y1 = parseInt(predictions[0].bbox[1])
  const p1x2 = parseInt(predictions[0].bbox[2])
  const p1y2 = parseInt(predictions[0].bbox[3])
  const [x, y] = [(p1x1 + p1x2) / 2, (p1y1 + p1y2) / 2] //center points for the hand

  if (gestRecorded) {
    ox = x
    oy = y
    gestRecorded = false
  } else {
    distx = x - ox
    disty = y - oy

    if (Math.abs(distx) > 10 || Math.abs(disty) > 10) {
      gestRecorded = true
      return Math.abs(distx) > Math.abs(disty)
        ? distx > 0
          ? 'right'
          : 'left'
        : disty > 0
        ? 'down'
        : 'up'
    }
  }
}

const getOpenClose = predictions => {
  //start and end points for both hands are assigned here
  const p1x1 = parseInt(predictions[0].bbox[0])
  const p1y1 = parseInt(predictions[0].bbox[1])
  const p1x2 = parseInt(predictions[0].bbox[2])
  const p1y2 = parseInt(predictions[0].bbox[3])
  const p2x1 = parseInt(predictions[1].bbox[0])
  const p2y1 = parseInt(predictions[1].bbox[1])
  const p2x2 = parseInt(predictions[1].bbox[2])
  const p2y2 = parseInt(predictions[1].bbox[3])
  //both hands center points
  const [x1, y1] = [(p1x1 + p1x2) / 2, (p1y1 + p1y2) / 2]
  const [x2, y2] = [(p2x1 + p2x2) / 2, (p2y1 + p2y2) / 2]
  // distance between both hands
  const dist = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
  //debouncing for open and close gestures
  if (gestureCount > 3 || gestureCount < -3) gestureCount = 0
  if (distOld === -1) {
    //initiating for the first distance between hands
    distOld = dist
    return
  }

  //calculating new difference between the old and new distance between hands
  dif = Math.abs(distOld - dist - dif) > 5 ? distOld - dist : dif

  let gesture = 'NONE'

  //if distance is changed by a threshold of 5, change the difference else keep it the same
  if (dif === distOld - dist) {
    //calculation for actual gestures open or close
    gesture = dif > 0 ? 'close' : 'open'
    if (gesture === 'open') gestureCount++
    //incrementing for 3 consecutive open captures
    else gestureCount--
    //decrementing for 3 consecutive close captures
  }
  //assigning the new distance to the old distance
  distOld = dist
  // return gesture
  if (gestureCount > 2) {
    return 'open'
  } else if (gestureCount < -2) {
    return 'close'
  }
}

async function runDetection() {
  await model.detect(video).then(predictions => {
    if (one && predictions.length >= 1) {
      div.innerText = getDirection(predictions) || 'NONE'
    } else if (two && predictions.length >= 2) {
      div.innerText = getOpenClose(predictions) || 'NONE'
    }
    model.renderPredictions(predictions, canvas, context, video)
    if (isVideo) {
      requestAnimationFrame(runDetection)
    } else {
      handTrack.stopVideo(video)
    }
  })
}
