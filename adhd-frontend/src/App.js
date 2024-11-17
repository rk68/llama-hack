import React, { useState, useEffect } from 'react'; // Combined React imports
import VoiceRecorder from './VoiceRecorder'; // Custom component
import './App.css'; // Styles
import '@fortawesome/fontawesome-free/css/all.min.css'; // Font Awesome for icons
import { Line, Bar } from 'react-chartjs-2'; // Chart.js components for Line and Bar charts
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LineController,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'; // Required Chart.js modules

// Register necessary components with Chart.js once
ChartJS.register(
    LineElement,
    PointElement,
    LineController,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend
);





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
  const [graphData, setGraphData] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [expandedBoxes, setExpandedBoxes] = useState({}); // Track expanded boxes
  const [emotionProbabilities, setEmotionProbabilities] = useState(null);
  const [wpmData, setWpmData] = useState({
    labels: [], // Labels for chart (e.g., "Recording 1", "Recording 2")
    wpm: [], // Words Per Minute data points
  });

  const emotionEmojis = {
    happy: '\u{1F60A}', // 😊
    sad: '\u{1F622}',   // 😢
    angry: '\u{1F621}', // 😡
    neutral: '\u{1F610}', // 😐
  };


  const mapEmotionsToEmoji = (probabilities) => {
    const emotions = ['happy', 'sad', 'angry', 'neutral'];


    // Map each emotion to its probability and emoji
    const emotionMapping = emotions.reduce((acc, emotion, index) => {
        acc[emotion] = {
            emoji: emotionEmojis[emotion],
            probability: probabilities[index],
        };
        return acc;
    }, {});

    // Find the emotion with the highest probability
    const topEmotion = Object.keys(emotionMapping).reduce((a, b) =>
        emotionMapping[a].probability > emotionMapping[b].probability ? a : b
    );

    return { topEmotion, emotionMapping };
};


  const [chartData, setChartData] = useState({
    labels: [],
    fillerWords: [],
    pauses: [],
    wpm: [],
  });


  const toggleBox = (index) => {
      setExpandedBoxes((prev) => ({
          ...prev,
          [index]: !prev[index], // Toggle the state of the selected box
      }));
  };

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
            if (data.emotion_info) {
                const { topEmotion, emotionMapping } = mapEmotionsToEmoji(data.emotion_info.probability);
                setEmotionInfo({ emotion: topEmotion, probability: emotionMapping[topEmotion].probability });
                setEmotionProbabilities(emotionMapping);
            }
            if (data.topic_analysis) setTopicAnalysis(data.topic_analysis);
            if (data.pitch_info) setPitchInfo(data.pitch_info);
            if (data.categories) {
                setInattentionData(data.categories.Inattention);
                setHyperactivityData(data.categories.Hyperactivity);
                setImpulsivityData(data.categories.Impulsivity);
            }
            if (data.graph_data) setGraphData(data.graph_data);

            // Fetch updated recordings list
            return fetch('http://localhost:5000/recordings');
        })
        .then((response) => response.json())
        .then((updatedRecordings) => setRecordings(updatedRecordings)) // Update recordings state
        .catch((error) => console.error('Error during analysis or fetching recordings:', error));
};



  const renderProgressChart = () => {
    // Check if there is no data to display
    if (chartData.labels.length === 0) return <p>No data available yet.</p>;

    const data = {
        labels: chartData.labels,
        datasets: [
            {
                label: 'Filler Words',
                data: chartData.fillerWords,
                borderColor: 'red',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.3,
            },
            {
                label: 'Number of Pauses',
                data: chartData.pauses,
                borderColor: 'blue',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                tension: 0.3,
            },
            {
                label: 'Words Per Minute (WPM)',
                data: chartData.wpm,
                borderColor: 'green',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.3,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Progress Over Time' },
        },
        scales: {
            x: { title: { display: true, text: 'Recordings' } },
            y: { title: { display: true, text: 'Count / Rate' } },
        },
    };

    return <Line data={data} options={options} />;
  };


  const renderEmotionBarChart = () => {
    if (!emotionProbabilities) return null;

    const labels = Object.keys(emotionProbabilities);
    const data = labels.map((label) => emotionProbabilities[label].probability);

    const chartData = {
        labels: labels.map((label) => `${emotionProbabilities[label].emoji} ${label}`), // Include emojis with labels
        datasets: [
            {
                label: 'Emotion Probabilities',
                data: data,
                backgroundColor: ['#ffdd57', '#57b6ff', '#ff5757', '#a9a9a9'], // Colors for bars
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Emotion Probabilities' },
        },
        scales: {
            x: { title: { display: true, text: 'Emotions' } },
            y: { title: { display: true, text: 'Probability' }, min: 0, max: 1 },
        },
    };

    return <Bar data={chartData} options={options} />;
};


  const renderPitchGraph = () => {
      if (!graphData) return null;

      const { chroma_mean, pitch_changes } = graphData;

      const data = {
          labels: chroma_mean.map((_, index) => index.toString()), // Use strings for labels
          datasets: [
              {
                  label: 'Chroma Mean',
                  data: chroma_mean,
                  borderColor: 'blue',
                  fill: false,
                  tension: 0.1,
              },
          ],
      };

      const options = {
          responsive: true,
          plugins: {
              legend: {
                  position: 'top',
              },
              title: {
                  display: true,
                  text: 'Pitch Analysis',
              },
          },
          elements: {
              point: {
                  pointStyle: 'circle',
                  radius: chroma_mean.map((_, index) =>
                      pitch_changes.includes(index) ? 6 : 3
                  ),
                  backgroundColor: chroma_mean.map((_, index) =>
                      pitch_changes.includes(index) ? 'red' : 'blue'
                  ),
              },
          },
          scales: {
              x: {
                  type: 'category', // Use the category scale explicitly
              },
          },
      };

      return <Line data={data} options={options} />;
  };

  useEffect(() => {
    fetch('http://localhost:5000/recordings') // Replace with the path to load your JSON
        .then((response) => response.json())
        .then((data) => {
            if (data && data.length > 0) {
                // Map data to chartData
                const labels = data.map((recording, index) => `Recording ${index + 1}`);
                const wpm = data.map((recording) => recording.details.wpm_info.wpm || 0);

                // Update chartData specifically for WPM chart
                setChartData((prev) => ({
                    ...prev,
                    labels,
                    wpm,
                }));

                // Optionally update other chart data if needed
                const fillerWords = data.map((recording) => recording.chart_data.filler_count || 0);
                const pauses = data.map((recording) => recording.chart_data.num_pauses || 0);

                setChartData((prev) => ({
                    ...prev,
                    fillerWords,
                    pauses,
                }));
            }
        })
        .catch((error) => console.error('Error fetching recordings:', error));
}, []);



  const handleNewRecording = (newRecording) => {
    const { date, details } = newRecording;

    setChartData((prev) => ({
        ...prev,
        labels: [...prev.labels, `Recording ${prev.labels.length + 1}`], // Add new label
        wpm: [...prev.wpm, details.wpm_info.wpm || 0], // Add new WPM value
    }));
  };



  const formatTextAsHTML = (text) => {
      if (!text) return '';

      let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formattedText = formattedText.replace(/\*\s(.*?)\n?/g, '<li>$1</li>');
      if (formattedText.includes('<li>')) {
          formattedText = formattedText.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
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
                    <div
                        dangerouslySetInnerHTML={{
                            __html: formatTextAsHTML(inattentionData.insights),
                        }}
                    ></div>
                    <h3>CBT Recommendations</h3>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: formatTextAsHTML(inattentionData.recommendations),
                        }}
                    ></div>
                </div>
                <div className="category-box">
                    <h2>Hyperactivity</h2>
                    <h3>Insights</h3>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: formatTextAsHTML(hyperactivityData.insights),
                        }}
                    ></div>
                    <h3>CBT Recommendations</h3>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: formatTextAsHTML(hyperactivityData.recommendations),
                        }}
                    ></div>
                </div>
                <div className="category-box">
                    <h2>Impulsivity</h2>
                    <h3>Insights</h3>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: formatTextAsHTML(impulsivityData.insights),
                        }}
                    ></div>
                    <h3>CBT Recommendations</h3>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: formatTextAsHTML(impulsivityData.recommendations),
                        }}
                    ></div>
                </div>
            </div>

            <div className="emotion-container">
                <h2>Detected Emotion</h2>
                {emotionInfo && (
                    <div className="top-emotion">
                        <span className="emoji">{emotionEmojis[emotionInfo.emotion]}</span>
                        <span className="emotion-name">{emotionInfo.emotion}</span>
                        <span className="probability">
                            ({(emotionInfo.probability * 100).toFixed(1)}%)
                        </span>
                    </div>
                )}
                <div className="emotion-bar-chart">{renderEmotionBarChart()}</div>
            </div>

            <div className="metrics-container">
              <h2>Words Per Minute (WPM) Progress</h2>
              {chartData.wpm.length === 0 ? (
                  <p>No recordings yet. Start recording to see your progress!</p>
              ) : (
                  <Line
                      data={{
                          labels: chartData.labels,
                          datasets: [
                              {
                                  label: 'Words Per Minute (WPM)',
                                  data: chartData.wpm,
                                  borderColor: 'green',
                                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                  tension: 0.3,
                              },
                          ],
                      }}
                      options={{
                          responsive: true,
                          plugins: {
                              legend: { position: 'top' },
                              title: { display: true, text: 'WPM Progress Over Time' },
                          },
                          scales: {
                              x: { title: { display: true, text: 'Recordings' } },
                              y: { title: { display: true, text: 'WPM' } },
                          },
                      }}
                  />
              )}
          </div>


            <div className="metrics-container">
                <h2>Pitch Analysis Graph</h2>
                {renderPitchGraph()}
            </div>

            <div className="metrics-container">
                <h2>Your Progress</h2>
                {renderProgressChart()}
            </div>


            {graphData && (
                <div className="metrics-container">
                    <h3>Insights</h3>
                    <ul>
                        <li>
                            The chroma mean values suggest{' '}
                            {graphData.chroma_mean.length > 10 ? 'dynamic' : 'static'} pitch
                            variations.
                        </li>
                        <li>
                            Detected {graphData.pitch_changes.length} significant pitch
                            changes, indicating{' '}
                            {graphData.pitch_changes.length > 5 ? 'expressive' : 'calm'} speech.
                        </li>
                    </ul>
                </div>
            )}

            {fillerInfo && (
                <div className="metrics-container">
                    <h2>Filler Word Analysis</h2>
                    <p>
                        <strong>Filler Count: </strong>
                        {fillerInfo.filler_count}
                    </p>
                    <p>
                        <strong>Filler Words: </strong>
                        {JSON.stringify(fillerInfo.filler_words, null, 2)}
                    </p>
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
                    <p>
                        <strong>Detected Emotion: </strong>
                        {emotionInfo.emotion}
                    </p>
                    <p>
                        <strong>Emotion Probability: </strong>
                        {JSON.stringify(emotionInfo.probability, null, 2)}
                    </p>
                </div>
            )}

            {wpmInfo && (
                <div className="metrics-container">
                    <h2>Words Per Minute (WPM)</h2>
                    <p>
                        <strong>WPM: </strong>
                        {wpmInfo.wpm}
                    </p>
                    <p>
                        <strong>Total Words: </strong>
                        {wpmInfo.total_words}
                    </p>
                    <p>
                        <strong>Duration (seconds): </strong>
                        {wpmInfo.duration_seconds}
                    </p>
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
                <h2>Previous Recordings</h2>
                {recordings.length === 0 ? (
                    <p>No recordings available yet. Start recording to see them here!</p>
                ) : (
                    <div className="chat-boxes">
                        {recordings.map((recording, index) => (
                            <div key={index} className="chat-box">
                                <p className="chat-date">{recording.date}</p>
                                <p className="chat-summary">{recording.summary}</p>
                                <div className="chat-buttons">
                                    <button
                                        className="chat-button"
                                        onClick={() => toggleBox(index)}
                                    >
                                        {expandedBoxes[index]
                                            ? 'Hide Results'
                                            : 'View Results'}
                                    </button>
                                    <button
                                        className="chat-button"
                                        onClick={() => toggleBox(index)}
                                    >
                                        {expandedBoxes[index]
                                            ? 'Hide Transcript'
                                            : 'View Transcript'}
                                    </button>
                                </div>
                                {expandedBoxes[index] && (
                                    <div className="expanded-content">
                                        <h3>Transcript:</h3>
                                        <p>{recording.details.transcription}</p>
                                        <h3>Results:</h3>
                                        <p>
                                            Insights:{' '}
                                            {JSON.stringify(recording.details.categories, null, 2)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;

