import React, { useState } from 'react';
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
    const [fillerInfo, setFillerInfo] = useState(null); // Added fillerInfo state
    const [isRecording, setIsRecording] = useState(false);
    const [inattentionData, setInattentionData] = useState({ insights: '', recommendations: '' });
    const [hyperactivityData, setHyperactivityData] = useState({ insights: '', recommendations: '' });
    const [impulsivityData, setImpulsivityData] = useState({ insights: '', recommendations: '' });
    


    const dummyChats = [
        { date: '2024-11-15', summary: 'Talked about weekend plans and activities.' },
        { date: '2024-11-14', summary: 'Discussed progress on personal goals and challenges.' },
        { date: '2024-11-13', summary: 'Analyzed a recent project and its outcomes.' },
        { date: '2024-11-12', summary: 'Reviewed notes from a previous meeting.' },
    ];

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
              if (data.filler_info) setFillerInfo(data.filler_info);
              if (data.wpm_info) setWpmInfo(data.wpm_info);
              if (data.pause_info) {
                  setNumPauses(data.pause_info.num_pauses);
                  setPauseLengths(data.pause_info.pause_lengths);
              }
              if (data.emotion_info) setEmotionInfo(data.emotion_info);
              if (data.topic_analysis) setTopicAnalysis(data.topic_analysis);
              if (data.pitch_info) setPitchInfo(data.pitch_info);
              if (data.categories) {
                  setInattentionData(data.categories.Inattention);
                  setHyperactivityData(data.categories.Hyperactivity);
                  setImpulsivityData(data.categories.Impulsivity);
              }
              console.log("Categories Data:", data.categories);

          })
          .catch((error) => console.error('Error during analysis:', error));
          
  };


  const formatTextAsHTML = (text) => {
    if (!text) return "";

    // Replace markdown-like bold with <strong> tags
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Replace markdown-like bullets with <li> tags
    formattedText = formattedText.replace(/\*\s(.*?)\n?/g, "<li>$1</li>");

    // Wrap bullet points in <ul> tags
    if (formattedText.includes("<li>")) {
        formattedText = formattedText.replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>");
    }

    return formattedText;
};

  
  
  

    return (
        <div className="main-container">
            <div className="prompt-container">
                <h1 className="prompt-text">How was your day?</h1>
                <p className="prompt-sub-text">Analyse your speech and gain insights</p>
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



        <div className="categories-container">
            <div className="category-box">
                <h2>Inattention</h2>
                <h3>Insights</h3>
                <div dangerouslySetInnerHTML={{ __html: formatTextAsHTML(inattentionData.insights) }}></div>
                <h3>CBT Recommendations</h3>
                <div dangerouslySetInnerHTML={{ __html: formatTextAsHTML(inattentionData.recommendations) }}></div>
            </div>
            <div className="category-box">
                <h2>Hyperactivity</h2>
                <h3>Insights</h3>
                <div dangerouslySetInnerHTML={{ __html: formatTextAsHTML(hyperactivityData.insights) }}></div>
                <h3>CBT Recommendations</h3>
                <div dangerouslySetInnerHTML={{ __html: formatTextAsHTML(hyperactivityData.recommendations) }}></div>
            </div>
            <div className="category-box">
                <h2>Impulsivity</h2>
                <h3>Insights</h3>
                <div dangerouslySetInnerHTML={{ __html: formatTextAsHTML(impulsivityData.insights) }}></div>
                <h3>CBT Recommendations</h3>
                <div dangerouslySetInnerHTML={{ __html: formatTextAsHTML(impulsivityData.recommendations) }}></div>
            </div>
        </div>







            {fillerInfo && (
                <div className="metrics-container">
                    <h2>Filler Word Analysis</h2>
                    <p><strong>Filler Count: </strong>{fillerInfo.filler_count}</p>
                    <p><strong>Filler Words: </strong>{JSON.stringify(fillerInfo.filler_words, null, 2)}</p>
                </div>
            )}

            {numPauses !== null && (
                <div className="metrics-container">
                    <h2>Number of Pauses</h2>
                    <p>{numPauses}</p>
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

            <div className="chat-history">
                <h2>Previous Chats</h2>
                <div className="chat-boxes">
                    {dummyChats.map((chat, index) => (
                        <div key={index} className="chat-box">
                            <p className="chat-date">{chat.date}</p>
                            <p className="chat-summary">{chat.summary}</p>
                            <div className="chat-buttons">
                                <button className="chat-button">Results</button>
                                <button className="chat-button">Transcript</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default App;
