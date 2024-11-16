import os
from flask import Flask, request, jsonify
from groq import Groq

from dotenv import load_dotenv
load_dotenv()  # Load environment variables from the .env file


app = Flask(__name__)

# Ensure the 'uploads' directory exists
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Create the 'uploads' directory if it doesn't exist

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided!"}), 400
    
    audio_file = request.files['audio']
    
    # Save the audio file temporarily in the 'uploads' directory
    audio_path = os.path.join(UPLOAD_FOLDER, 'recording.wav')  # Save it as 'recording.wav'
    try:
        audio_file.save(audio_path)
    except Exception as e:
        return jsonify({"error": f"Error saving the file: {str(e)}"}), 500
    
    try:
        # Transcribe the audio using Groq API
        transcription = get_transcription(audio_path)
        
        # Clean up the temporary file after transcription
        os.remove(audio_path)
        
        return jsonify({"transcription": transcription})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_transcription(audio_path):
    with open(audio_path, 'rb') as audio_file:
        transcription = client.audio.transcriptions.create(
            file=(audio_path, audio_file.read()),
            model="distil-whisper-large-v3-en",
            response_format="verbose_json",
        )
        return transcription.text

if __name__ == '__main__':
    app.run(debug=True)
