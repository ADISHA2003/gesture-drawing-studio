import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

class GestureDrawingApp {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.gestureOutput = document.getElementById("gesture-output");
    this.clearBtn = document.getElementById("clear-btn");
    this.undoBtn = document.getElementById("undo-btn");
    this.redoBtn = document.getElementById("redo-btn");
    this.videoElement = document.getElementById("video");
    this.colorPicker = document.getElementById("color-picker");
    this.brushSizePicker = document.getElementById("brush-size");
    this.fingerIndicator = document.getElementById("finger-indicator");
    this.toggleControlsBtn = document.getElementById("toggle-controls-btn");
    this.toggleWebcamBtn = document.getElementById("toggle-webcam-btn"); // New webcam button
    this.controls = document.getElementById("controls");

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.drawing = false;
    this.lastPosition = null;
    this.currentColor = this.colorPicker.value;
    this.currentBrushSize = this.brushSizePicker.value;

    this.drawHistory = [];
    this.redoHistory = [];

    this.isWebcamOn = false; // Track webcam status

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.colorPicker.addEventListener("input", (e) => {
      this.currentColor = e.target.value;
    });

    this.brushSizePicker.addEventListener("input", (e) => {
      this.currentBrushSize = e.target.value;
    });

    this.clearBtn.addEventListener("click", () => this.clearCanvas());
    this.undoBtn.addEventListener("click", () => this.undo());
    this.redoBtn.addEventListener("click", () => this.redo());

    this.toggleControlsBtn.addEventListener("click", () => {
      this.controls.style.display = this.controls.style.display === "none" ? "flex" : "none";
    });

    this.toggleWebcamBtn.addEventListener("click", () => {
      if (this.isWebcamOn) {
        this.stopWebcam();
      } else {
        this.startWebcam();
      }
      this.isWebcamOn = !this.isWebcamOn;
      this.toggleWebcamBtn.textContent = this.isWebcamOn ? "Turn Off Webcam" : "Turn On Webcam";
    });

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  saveCanvasState() {
    this.drawHistory.push(this.canvas.toDataURL());
    this.redoHistory = []; // Clear redo stack when a new action is performed
  }

  undo() {
    if (this.drawHistory.length > 0) {
      this.redoHistory.push(this.canvas.toDataURL());
      const previousState = this.drawHistory.pop();
      this.restoreCanvasState(previousState);
    }
  }

  redo() {
    if (this.redoHistory.length > 0) {
      const nextState = this.redoHistory.pop();
      this.drawHistory.push(this.canvas.toDataURL());
      this.restoreCanvasState(nextState);
    }
  }

  restoreCanvasState(dataUrl) {
    const img = new Image();
    img.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  }

  clearCanvas() {
    this.saveCanvasState();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.gestureOutput.textContent = "Canvas cleared!";
  }

  resizeCanvas() {
    // Adjust canvas size based on window size
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    tempCtx.drawImage(this.canvas, 0, 0);

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.drawImage(tempCanvas, 0, 0);
  }

  async initHandLandmarker() {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    this.handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
    });
  }

  async startWebcam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.srcObject = stream;
      this.videoElement.addEventListener("loadeddata", () => {
        this.detectHands(this.videoElement);
      });
    } catch (err) {
      console.error("Error starting webcam:", err);
      this.gestureOutput.textContent = "Failed to access webcam.";
    }
  }

  stopWebcam() {
    const stream = this.videoElement.srcObject;
    const tracks = stream.getTracks();

    tracks.forEach(track => track.stop());
    this.videoElement.srcObject = null;
    this.gestureOutput.textContent = "Webcam turned off.";
  }

  async detectHands(video) {
    const detect = async () => {
      if (this.handLandmarker && video.readyState === 4) {
        const results = await this.handLandmarker.detectForVideo(video, Date.now());

        if (results.landmarks.length > 0) {
          const hand = results.landmarks[0];
          const indexFinger = hand[8];
          const thumb = hand[4];

          const x = (1 - indexFinger.x) * this.canvas.width;
          const y = indexFinger.y * this.canvas.height;

          this.fingerIndicator.style.left = `${x}px`;
          this.fingerIndicator.style.top = `${y}px`;

          const distance = Math.sqrt(
            Math.pow((indexFinger.x - thumb.x) * this.canvas.width, 2) +
            Math.pow((indexFinger.y - thumb.y) * this.canvas.height, 2)
          );

          if (distance < 50) {
            this.drawing = true;
            this.gestureOutput.textContent = "Drawing in progress!";
          } else {
            if (this.drawing) {
              this.saveCanvasState(); // Save state when drawing stops
            }
            this.drawing = false;
            this.lastPosition = null;
            this.gestureOutput.textContent = "Pinch to start drawing!";
          }

          if (this.drawing) {
            if (this.lastPosition) {
              const numSteps = 10;
              for (let i = 1; i <= numSteps; i++) {
                const t = i / numSteps;
                const intermediateX = this.lastPosition.x + t * (x - this.lastPosition.x);
                const intermediateY = this.lastPosition.y + t * (y - this.lastPosition.y);

                this.ctx.beginPath();
                this.ctx.moveTo(this.lastPosition.x, this.lastPosition.y);
                this.ctx.lineTo(intermediateX, intermediateY);
                this.ctx.strokeStyle = this.currentColor;
                this.ctx.lineWidth = this.currentBrushSize;
                this.ctx.lineCap = "round";
                this.ctx.stroke();
              }
            }
            this.lastPosition = { x, y };
          }
        }
      }

      if (this.isWebcamOn) {
        requestAnimationFrame(detect);
      }
    };

    detect();
  }
}

const app = new GestureDrawingApp();
app.initHandLandmarker();