
const URL = "https://teachablemachine.withgoogle.com/models/hgJhqzFQx/";
let model, webcam, ctx, labelContainer, maxPredictions;

function setup() {
    const canvas = document.getElementById("canvas");
    canvas.width = 640;
    canvas.height = 480;
    ctx = canvas.getContext("2d");
}

document.addEventListener('DOMContentLoaded', () => {
    setup();
    labelContainer = document.getElementById("label-container");
    const startButton = document.getElementById("start-button");
    const stopButton = document.getElementById("stop-button");
    startButton.onclick = startCamera;
    stopButton.onclick = stopCamera;
});

async function startCamera() {
    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        // Load the model and metadata
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Setup webcam
        const size = 640;
        const flip = true;
        webcam = new tmPose.Webcam(size, size, flip);
        await webcam.setup();
        await webcam.play();
        window.requestAnimationFrame(predictionLoop);

        // Set up labels
        for (let i = 0; i < maxPredictions; i++) {
            labelContainer.appendChild(document.createElement("div"));
        }

        // Start the instructional video
        const video = document.getElementById('instructional-video');
        video.style.display = 'block';
        video.play();
    } catch (error) {
        console.error("Error starting camera:", error);
    }
}

async function predictionLoop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(predictionLoop);
}

async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ": " + prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;

        if (prediction[i].className === "pose 2" && prediction[i].probability > 0.7) {
            console.log("Pose 2 detected with high confidence!");
        }
    }

    drawPose(pose);
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}
async function stopCamera() {
    if (webcam) {
        await webcam.stop();
        webcam = null;
    }
    if (model) {
        model.dispose();
        model = null;
    }
    const video = document.getElementById('instructional-video');
    video.pause();
    video.style.display = 'none';
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Clear the labels
    while (labelContainer.firstChild) {
        labelContainer.removeChild(labelContainer.firstChild);
    }
}
