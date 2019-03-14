//const handTrack = require('handtrackjs')
const video = document.getElementById('myvideo')
const canvas = document.getElementById('image-board')
const context = canvas.getContext('2d')
const btn = document.getElementById('btn')
const div = document.getElementById('pred')

video.style.display = 'none'

let model = null

const modelParams = {
  flipHorizontal: true, // flip e.g for video
  imageScaleFactor: 0.6,
  maxNumBoxes: 4, // maximum number of boxes to detect
  iouThreshold: 0.4, // ioU threshold for non-max suppression
  scoreThreshold: 0.7, // confidence threshold for predictions.
}

// Load the model.
handTrack.load(modelParams).then(lmodel => {
  // detect objects in the image.
  model = lmodel
  div.innerText += 'Loaded Model!'
})

// video.width = 500
// video.height = 400

const init = async () => {
  let model = await handTrack.load()
  console.log('!!!model loaded!!!', model)
  return model
}
// model = init()
isVideo = false

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
let distOld = -1
let dif = 0
let gestureCount = 0
const [w, h] = [canvas.width, canvas.height]
let [distx, disty] = [null, null]
let [ox, oy] = [0, 0]
let xs = []
let ys = []

let gestRecorded = true
let direction = ''
let hinc = null
let vinc = null

async function runDetection() {
  await model.detect(video).then(predictions => {
    if (predictions.length === 1) {
      //start and end points for the hand
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
          direction =
            Math.abs(distx) > Math.abs(disty)
              ? distx > 0
                ? 'right'
                : 'left'
              : disty > 0
              ? 'down'
              : 'up'
          gestRecorded = true
          console.log(direction)
        }
      }

      /*
      if (distx === null && disty === null) {
        //initiating the first distance with respect to left and top boundary of the viewport
        distx = x
        xs.push(distx)
        disty = y
        ys.push(disty)
      } else {
        //caluclating successive changes from left and top boundaries above the threshold of 10
        distx = Math.abs(distx - x) > 10 ? distx - x : distx
        disty = Math.abs(disty - y) > 10 ? disty - y : disty

        if (xs.length > 0) {
          xs.unshift()
        }
        xs.push(distx)
        hinc = xs[0] - xs[1] < 0
        if (ys.length > 0) {
          ys.unshift()
        }
        ys.push(disty)
        vinc = ys[0] - ys[1] < 0

        let actualDir = null
        if (xs[0] - xs[1] > ys[0] - ys[1]) actualDir = hinc ? 'right' : 'left'
        else actualDir = vinc ? 'down' : 'up'

        console.log(actualDir)
      }
    */
      model.renderPredictions(predictions, canvas, context, video)
    } else if (predictions.length === 2) {
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
      if (gestureCount > 5 || gestureCount < -5) gestureCount = 0
      if (distOld === -1) {
        //initiating for the first distance between hands
        distOld = dist
      } else {
        //calculating new difference between the old and new distance between hands
        dif = Math.abs(distOld - dist - dif) > 5 ? distOld - dist : dif
        //if distance is changed by a threshold of 5, change the difference else keep it the same
        if (dif === distOld - dist) {
          //calculation for actual gestures open or close
          const gesture = dif > 0 ? 'close' : 'open'
          if (gesture === 'open') gestureCount++
          //incrementing for 3 consecutive open captures
          else gestureCount-- //decrementing for 3 consecutive close captures
          if (gestureCount > 3) console.log('open', dif)
          else if (gestureCount < -3) console.log('close', dif)
        }
        distOld = dist //assigning the new distance to the old distance
      }
      //   console.log(
      //     `point 1: (${p1x}, ${p1y}), point 2: (${p2x}, ${p2y}), distance: ${dist}`
      //   )

      model.renderPredictions(predictions, canvas, context, video)
    }
    if (isVideo) {
      requestAnimationFrame(runDetection)
    } else {
      handTrack.stopVideo(video)
    }
  })
}

function run() {
  isVideo = !isVideo
  if (isVideo) strtVideo()
}

btn.addEventListener('click', run)
