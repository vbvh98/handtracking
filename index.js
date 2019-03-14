const handTrack = require('handtrackjs')
const video = document.getElementById('myvideo')
const canvas = document.getElementById('image-board')
const context = canvas.getContext('2d')
const btn = document.getElementById('btn')
const div = document.getElementById('pred')

video.style.display = 'none'

let model = null

const modelParams = {
	flipHorizontal: true, // flip e.g for video
	imageScaleFactor: 0.7,
	maxNumBoxes: 4, // maximum number of boxes to detect
	iouThreshold: 0.5, // ioU threshold for non-max suppression
	scoreThreshold: 0.6, // confidence threshold for predictions.
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

async function runDetection() {
	await model.detect(video).then(predictions => {
		div.innerText += 'Predictions: ' + predictions
		model.renderPredictions(predictions, canvas, context, video)
		if (isVideo) {
			requestAnimationFrame(runDetection)
		}
	})
}

function run() {
	isVideo = !isVideo
	if (isVideo) strtVideo()
}

btn.addEventListener('click', run)
