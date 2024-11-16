import React, { useState, useRef } from 'react';
import VoiceRecorder from './VoiceRecorder';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const App = () => {
    const [insights, setInsights] = useState(null);
    const [numPauses, setNumPauses] = useState(null);
    const [pauseLengths, setPauseLengths] = useState(null);
    const [emotionInfo, setEmotionInfo] = useState(null);
    const [topicAnalysis, setTopicAnalysis] = useState(null);
    const [pitchInfo, setPitchInfo] = useState(null);
    const [wpmInfo, setWpmInfo] = useState(null);
    const [isRecording, setIsRecording] = useState(false);

    const handleRecordingComplete = (audioBlob) => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        fetch('http://localhost:5000/transcribe', {
            method: 'POST',
            body: formData,
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data); // Debugging log

                if (data.transcription) setInsights(data.transcription);
                if (data.filler_info) console.log('Filler info:', data.filler_info);
                if (data.wpm_info) setWpmInfo(data.wpm_info);
                if (data.num_pauses !== undefined) setNumPauses(data.num_pauses);
                if (data.pause_lengths) setPauseLengths(data.pause_lengths);
                if (data.emotion_info) setEmotionInfo(data.emotion_info);
                if (data.topic_analysis) setTopicAnalysis(data.topic_analysis);
                if (data.pitch_info) setPitchInfo(data.pitch_info);
            })
            .catch((error) => console.error('Error during analysis:', error));
    };

    return (
        <div className="main-container">
            <div className="prompt-container">
                <h1 className="prompt-text">How have you been feeling today? Please record your thoughts.</h1>
            </div>

            <div className="microphone-container">
                <VoiceRecorder
                    onRecordingComplete={handleRecordingComplete}
                    setIsRecording={setIsRecording}
                    isRecording={isRecording}
                />
                <p>{isRecording ? "Recording in progress..." : "Click the button to start recording"}</p>
            </div>

            {insights && (
                <div className="metrics-container">
                    <h2>Transcription</h2>
                    <pre>{insights}</pre>
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
                    <pre>{JSON.stringify(pauseLengths, null, 2)}</pre>
                </div>
            )}

            {emotionInfo && (
                <div className="metrics-container">
                    <h2>Emotion Analysis</h2>
                    <p><strong>Detected Emotion: </strong>{emotionInfo.emotion}</p>
                    <p><strong>Emotion Probability: </strong>{JSON.stringify(emotionInfo.probability, null, 2)}</p>
                </div>
            )}

            {wpmInfo && (
                <div className="metrics-container">
                    <h2>Words Per Minute (WPM)</h2>
                    <p><strong>WPM: </strong>{wpmInfo.wpm}</p>
                    <p><strong>Total Words: </strong>{wpmInfo.total_words}</p>
                    <p><strong>Duration (seconds): </strong>{wpmInfo.duration_seconds}</p>
                </div>
            )}

            {pitchInfo && (
                <div className="metrics-container">
                    <h2>Pitch Analysis</h2>
                    <pre>{JSON.stringify(pitchInfo, null, 2)}</pre>
                </div>
            )}

            {topicAnalysis && (
                <div className="metrics-container">
                    <h2>Topic Analysis</h2>
                    <pre>{topicAnalysis}</pre>
                </div>
            )}
        </div>
    );
};

export default App;
