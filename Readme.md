# Gesture Drawing Studio

## Overview

Gesture Drawing Studio is an interactive drawing app that allows users to draw on a canvas using hand gestures. The app uses hand tracking via MediaPipe to detect finger movements, enabling intuitive drawing with gestures like pinching and drawing with the index finger. It offers an easy-to-use interface with options to customize the brush color, size, and undo/redo actions.

## Features

- **Gesture-based Drawing**: Draw directly with hand gestures such as index finger pointing and pinching.
- **Real-Time Hand Detection**: Uses MediaPipe for real-time hand landmark detection to track finger movements.
- **Customizable Drawing Tools**: Change brush color and size using simple controls.
- **Canvas Controls**: Clear the canvas, undo and redo actions for a smooth drawing experience.
- **Webcam Integration**: Toggle the webcam to enable hand gesture detection.
- **Finger Indicator**: Shows a red dot to represent the detected index finger position on the screen.

## Technology Stack

- **Hand Gesture Recognition**: MediaPipe HandLandmarker
- **Frontend**: HTML, CSS, JavaScript (Vanilla JS)
- **Canvas Rendering**: HTML5 Canvas API
- **WebRTC**: For webcam integration