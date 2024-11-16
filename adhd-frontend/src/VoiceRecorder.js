// src/VoiceRecorder.js
import React, { useState, useRef } from 'react';
import RecordRTC from 'recordrtc';

const VoiceRecorder = ({ onRecordingComplete }) => {
    const [recording, setRecording] = useState(false);
    const [audioURL, setAudioURL] = useState(null);
    const recorderRef = useRef(null);

    const startRecording = () => {
        setRecording(true);

        // Start recording with RecordRTC
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                recorderRef.current = new RecordRTC(stream, { type: 'audio' });
                recorderRef.current.startRecording();
            })
            .catch((error) => {
                console.error('Error accessing microphone:', error);
            });
    };

    const stopRecording = () => {
        setRecording(false);
        recorderRef.current.stopRecording(() => {
            const audioBlob = recorderRef.current.getBlob();
            const audioURL = URL.createObjectURL(audioBlob);
            setAudioURL(audioURL);
            onRecordingComplete(audioBlob); // Pass audio blob to parent component
        });
    };

    return (
        <div>
            <h2>Record Your Voice</h2>
            <div>
                <button onClick={startRecording} disabled={recording}>
                    Start Recording
                </button>
                <button onClick={stopRecording} disabled={!recording}>
                    Stop Recording
                </button>
            </div>
            {audioURL && <audio src={audioURL} controls />}
        </div>
    );
};

export default VoiceRecorder;
