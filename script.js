const URL = "https://teachablemachine.withgoogle.com/models/icC494T4P/";
let model, webcam, ctx, labelContainer, maxPredictions;
const explosionSound = new Audio('explsn.mp3');
explosionSound.volume = 0.8;  // Set explosion sound volume to 80%
let lastSoundTime = 0;
let explosionStartTime = 0;
let isExploding = false;
let dotSize = 5;

function setup() {
    const canvas = document.getElementById("canvas");
    canvas.width = 640;
    canvas.height = 480;
    ctx = canvas.getContext("2d");
}

document.addEventListener('DOMContentLoaded', () => {
    setup();
    labelContainer = document.getElementById("label-container");
    const startPoseButton = document.getElementById("start-pose-button");
    const startVideoButton = document.getElementById("start-video-button");
    const stopButton = document.getElementById("stop-button");
    startPoseButton.onclick = startPoseDetection;
    startVideoButton.onclick = startInstructionalVideo;
    stopButton.onclick = stopAll;
});

async function startPoseDetection() {
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
    } catch (error) {
        console.error("Error starting camera:", error);
    }
}

async function startInstructionalVideo() {
    const video = document.getElementById('instructional-video');
    const timeDisplay = document.getElementById('video-time');
    video.style.display = 'block';
    video.volume = 0.3;  // Set video volume to 30%
    video.play();
    
    // Update time display
    video.addEventListener('timeupdate', () => {
        timeDisplay.textContent = `Video Time: ${video.currentTime.toFixed(2)} seconds`;
    });
}

async function predictionLoop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(predictionLoop);
}

let prediction = [];
async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    prediction = await model.predict(posenetOutput);

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ": " + prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }

    drawPose(pose);
}



function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            const video = document.getElementById('instructional-video');
            const videoTime = video.currentTime;
            
            // Check poses and video time conditions
            const isPose1 = prediction.some(pred => 
                pred.className === "pose 1" && pred.probability > 0.85
            );
            
            const isPose2 = prediction.some(pred => 
                (pred.className === "pose 2l" || pred.className === "pose 2r") && pred.probability > 0.85
            );
            
            const isPose3 = prediction.some(pred => 
                pred.className === "pose 3" && pred.probability > 0.85
            );

            const isPose4 = prediction.some(pred => 
                pred.className === "pose 4" && pred.probability > 0.85
            );

            const isPose5 = prediction.some(pred => 
                pred.className === "pose 5" && pred.probability > 0.85
            );
            
            // Set color based on conditions
            let dotColor = '#800080'; // default color (purple)
            
            const currentTime = Date.now();
            
            if (isPose1 && videoTime >= 4 && videoTime <= 8 ||
                isPose2 && videoTime >= 9 && videoTime <= 13 ||
                isPose3 && videoTime >= 15 && videoTime <= 17 ||
                isPose4 && videoTime >= 17 && videoTime <= 18 ||
                isPose5 && videoTime >= 15 && videoTime <= 17) {
                
                if (!isExploding) {
                    isExploding = true;
                    explosionStartTime = currentTime;
                    if (currentTime - lastSoundTime > 1000) {
                        explosionSound.currentTime = 0;
                        explosionSound.play();
                        lastSoundTime = currentTime;
                    }
                }
            }

            if (isExploding && currentTime - explosionStartTime > 500) {
                isExploding = false;
            }

            if (isExploding) {
                if (isPose1 && videoTime >= 4 && videoTime <= 8) dotColor = 'red';
                else if (isPose2 && videoTime >= 9 && videoTime <= 13) dotColor = 'green';
                else if (isPose3 && videoTime >= 15 && videoTime <= 17) dotColor = 'orange';
                else if (isPose4 && videoTime >= 17 && videoTime <= 18) dotColor = 'yellow';
                else if (isPose5 && videoTime >= 15 && videoTime <= 17) dotColor = 'pink';
            }
            
            ctx.fillStyle = dotColor;
            ctx.strokeStyle = dotColor;
            
            // Draw keypoints and skeleton
            // Calculate dot size based on explosion state
            if (isExploding) {
                const timeSinceExplosion = currentTime - explosionStartTime;
                if (timeSinceExplosion <= 1000) {
                    // Increase size for 0.5s, then decrease for 0.5s
                    dotSize = timeSinceExplosion <= 500 ? 
                        5 + (timeSinceExplosion / 500) * 15 : // Expand to 20
                        20 - ((timeSinceExplosion - 500) / 500) * 15; // Shrink back to 5
                } else {
                    dotSize = 5;
                    isExploding = false;
                }
            } else {
                dotSize = 5;
            }

            pose.keypoints.forEach(point => {
                if (point.score > minPartConfidence) {
                    ctx.beginPath();
                    ctx.arc(point.position.x, point.position.y, dotSize, 0, 2 * Math.PI);
                    ctx.fill();
                }
            });
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);

            prediction.forEach((pred, index) => {
                pred.wasHighConfidence = pred.probability > 0.7;
            });
        }
    }
}
async function stopAll() {
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
