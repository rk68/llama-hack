import os
from flask import Flask, request, jsonify
from groq import Groq
import librosa
import numpy as np
from dotenv import load_dotenv
from speechbrain.inference.interfaces import foreign_class
import torchaudio

load_dotenv()  # Load environment variables from the .env file

app = Flask(__name__)

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Initialize SpeechBrain Emotion Recognition Model
# Ensure 'custom_interface.py' is in the same directory or provide the correct path
classifier = foreign_class(
    source="speechbrain/emotion-recognition-wav2vec2-IEMOCAP", 
    pymodule_file="custom_interface.py", 
    classname="CustomEncoderWav2vec2Classifier"
)

# Ensure the 'uploads' directory exists
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided!"}), 400

    audio_file = request.files['audio']
    audio_path = os.path.join(UPLOAD_FOLDER, 'recording.wav')

    # Save the audio file temporarily in the 'uploads' directory
    audio_file.save(audio_path)

    try:
        # Detect pauses (silence segments)
        pause_info = detect_pauses(audio_path)

        # Perform emotion detection with SpeechBrain
        emotion_info = detect_emotions(audio_path)

        # Process the audio for transcription (example, using Groq)
        transcription = get_transcription(audio_path)

        # Perform topic analysis on the transcription using Groq
        topic_analysis = analyze_topics_with_groq(transcription)

        # Clean up the temporary file
        os.remove(audio_path)

        # Return transcription, pause info, emotion info, and topic analysis
        return jsonify({
            "transcription": transcription,
            "pause_info": pause_info,
            "emotion_info": emotion_info,
            "topic_analysis": topic_analysis
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def detect_pauses(audio_path):
    # Load the audio file using librosa
    y, sr = librosa.load(audio_path)

    # Set the silence threshold and frame parameters
    silence_threshold = 0.50  # Energy threshold for detecting silence (can be adjusted)
    frame_length = 1024  # Length of each frame in samples
    hop_length = 512  # Step size between consecutive frames

    # Calculate the energy of the signal (Root Mean Square - RMS)
    energy = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)

    # Identify silent frames where energy is below the threshold
    silent_frames = energy < silence_threshold

    # Convert frame indices to time (in seconds)
    silent_times = librosa.frames_to_time(np.where(silent_frames)[1], sr=sr, hop_length=hop_length)

    # If no silences are detected, return an empty list
    if len(silent_times) < 2:
        return {"num_pauses": 0, "pause_lengths": []}

    # Calculate the pause lengths (differences between consecutive silences)
    pause_lengths = np.diff(silent_times)

    # Filter out very short pauses (if necessary, e.g., pauses less than 0.1s)
    pause_lengths = pause_lengths[pause_lengths > 0.1]

    return {"num_pauses": len(pause_lengths), "pause_lengths": pause_lengths.tolist()}


def detect_emotions(audio_path):
    # Use the classifier to detect emotion from the audio file
    # The classifier expects a file path to the audio for emotion detection
    out_prob, score, index, text_lab = classifier.classify_file(audio_path)

    # Return the emotion detected and the probabilities
    return {
        "emotion": text_lab,  # Emotion label (happy, angry, sad, etc.)
        "probability": out_prob[0].tolist()  # Emotion probabilities for each class
    }


def get_transcription(audio_path):
    with open(audio_path, 'rb') as audio_file:
        transcription = client.audio.transcriptions.create(
            file=(audio_path, audio_file.read()),
            model="distil-whisper-large-v3-en",
            response_format="verbose_json",
        )
        return transcription.text


def analyze_topics_with_groq(transcription):
    try:
        # Send the transcription text to Groq's model for topic analysis
        completion = client.chat.completions.create(
            model="llama-3.2-3b-preview",
            messages=[
                {
                    "role": "user",
                    "content": f"I'm interested in how the speaker here changes topics and if they stay on track or not, summarise it: {transcription}"
                }
            ],
            temperature=1,
            max_tokens=1024,
            top_p=1,
            stream=True,
            stop=None,
        )

        topic_analysis = ""
        for chunk in completion:
            topic_analysis += chunk.choices[0].delta.content or ""

        return topic_analysis
    except Exception as e:
        return f"Error analyzing topics: {str(e)}"


if __name__ == '__main__':
    app.run(debug=True)
