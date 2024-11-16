// src/App.js
import React, { useState } from 'react';
import VoiceRecorder from './VoiceRecorder';

const App = () => {
    const [insights, setInsights] = useState(null);  // To store transcription

    // Handle the completion of the recording
    const handleRecordingComplete = (audioBlob) => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav'); // Assuming WAV file

        // Send the audio file to Flask backend for transcription
        fetch('http://localhost:5000/transcribe', {
            method: 'POST',
            body: formData,
        })
        .then((response) => response.json())  // Get the JSON response
        .then((data) => {
            if (data.transcription) {
                setInsights(data.transcription);  // Set transcription text to state
            } else {
                console.error('Error: No transcription found in response.');
            }
        })
        .catch((error) => console.error('Error during transcription:', error));
    };

    return (
        <div>
            <h1>ADHD Voice Analysis</h1>
            <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
            
            {insights && (
                <div>
                    <h2>Transcription</h2>
                    <pre>{insights}</pre> {/* Display transcription */}
                </div>
            )}
        </div>
    );
};

export default App;
