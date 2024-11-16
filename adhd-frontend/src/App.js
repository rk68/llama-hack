import React, { useState } from 'react';
import VoiceRecorder from './VoiceRecorder';

const App = () => {
    const [insights, setInsights] = useState(null);  // To store transcription
    const [numPauses, setNumPauses] = useState(null);  // To store the number of pauses
    const [pauseLengths, setPauseLengths] = useState(null);  // To store the lengths of pauses
    const [emotionInfo, setEmotionInfo] = useState(null);  // To store emotion information
    const [topicAnalysis, setTopicAnalysis] = useState(null);  // To store topic analysis
    const [isRecording, setIsRecording] = useState(false);  // To track if recording is in progress

    // Handle the completion of the recording
    const handleRecordingComplete = (audioBlob) => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav'); // Assuming WAV file

        // Send the audio file to Flask backend for transcription, pause detection, and emotion analysis
        fetch('http://localhost:5000/transcribe', {
            method: 'POST',
            body: formData,
        })
        .then((response) => response.json())  // Get the JSON response
        .then((data) => {
            console.log(data); // Add a console log to inspect the returned data

            if (data.transcription) {
                setInsights(data.transcription);  // Set transcription text
            } else {
                console.error('Error: No transcription found in response.');
            }

            if (data.pause_info && data.pause_info.num_pauses !== undefined) {
                setNumPauses(data.pause_info.num_pauses);  // Set the number of pauses
            }

            if (data.pause_info && data.pause_info.pause_lengths) {
                setPauseLengths(data.pause_info.pause_lengths);  // Set the pause lengths
            }

            if (data.emotion_info) {
                setEmotionInfo(data.emotion_info);  // Set the emotion info
            }

            if (data.topic_analysis) {
                setTopicAnalysis(data.topic_analysis);  // Set the topic analysis
            }
        })
        .catch((error) => console.error('Error during transcription and emotion analysis:', error));
    };

    return (
        <div className="main-container">
            <div className="prompt-container">
                <h1 className="prompt-text">How have you been feeling today? Please record your thoughts.</h1>
            </div>

            <div className="microphone-container">
                <VoiceRecorder
                    onRecordingComplete={handleRecordingComplete} // Pass the callback to handle the completion
                    setIsRecording={setIsRecording} // Pass the setter to track recording state
                    isRecording={isRecording} // Check if the recording is in progress
                />
                <p>Click the microphone to start recording</p>
            </div>

            {insights && (
                <div className="metrics-container">
                    <h2>Transcription</h2>
                    <pre>{insights}</pre> {/* Display transcription */}
                </div>
            )}

            {numPauses !== null && (
                <div className="metrics-container">
                    <h2>Number of Pauses: {numPauses}</h2>
                </div>
            )}

            {pauseLengths && (
                <div className="metrics-container">
                    <h2>Pause Lengths (in seconds)</h2>
                    <pre>{JSON.stringify(pauseLengths, null, 2)}</pre> {/* Display pause lengths */}
                </div>
            )}

            {emotionInfo && (
                <div className="metrics-container">
                    <h2>Emotion Analysis</h2>
                    <p><strong>Detected Emotion: </strong>{emotionInfo.emotion}</p>
                    <p><strong>Emotion Probability: </strong>{JSON.stringify(emotionInfo.probability, null, 2)}</p>
                </div>
            )}

            {topicAnalysis && (
                <div className="metrics-container">
                    <h2>Topic Analysis</h2>
                    <pre>{topicAnalysis}</pre> {/* Display topic analysis */}
                </div>
            )}
        </div>
    );
};

export default App;
