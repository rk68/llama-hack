import React from 'react';

const MetricsPage = ({ 
    insights, 
    numPauses, 
    pauseLengths, 
    emotionInfo, 
    topicAnalysis, 
    pitchInfo, 
    wpmInfo 
}) => {
    return (
        <div className="metrics-page">
            <h1>Analysis Results</h1>

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

export default MetricsPage;
