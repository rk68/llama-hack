import React, { useRef, useEffect, useState } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import RecordRTC from 'recordrtc';
import './VoiceRecorder.css'; // Import the CSS file

const VoiceRecorder = ({ onRecordingComplete, setIsRecording, isRecording }) => {
    const recorderRef = useRef(null);
    const [audioURL, setAudioURL] = useState(null);

    useEffect(() => {
        return () => {
            if (recorderRef.current) {
                recorderRef.current.destroy();
            }
        };
    }, []);

    const startRecording = () => {
        setIsRecording(true);
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                recorderRef.current = new RecordRTC(stream, { type: 'audio' });
                recorderRef.current.startRecording();
            })
            .catch((error) => console.error('Error accessing microphone:', error));
    };

    const stopRecording = () => {
        setIsRecording(false);
        recorderRef.current.stopRecording(() => {
            const audioBlob = recorderRef.current.getBlob();
            const audioURL = URL.createObjectURL(audioBlob);
            setAudioURL(audioURL);
            onRecordingComplete(audioBlob);
        });
    };

    return (
        <div className="recording-container">
            <div className="microphone-box">
                {isRecording ? (
                    <button className="stop-button" onClick={stopRecording}>
                        <FaStop />
                        Stop Recording
                    </button>
                ) : (
                    <button className="start-button" onClick={startRecording}>
                        <FaMicrophone />
                    </button>
                )}
            </div>
            {audioURL && (
                <div className="audio-preview">
                    <audio src={audioURL} controls />
                </div>
            )}
        </div>
    );
};

export default VoiceRecorder;
