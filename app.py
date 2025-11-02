from flask import Flask, render_template, request, jsonify
from backend.yt_to_mp3 import link_to_mp3
from backend.mp3_to_json import transcribe_audios
from backend.embeddings import to_embeddings
from backend.process_incomings import chat_with_gemini

app = Flask(__name__)

embeddings_ready = False

@app.route('/', methods=['GET', 'POST'])
def index():
    global embeddings_ready
    if request.method == 'POST':
        data = request.get_json()
        chatbot_name = data.get('chatbot_name')
        downloads = [(d['url'], d['name'].replace(" ", "_")) for d in data.get('downloads', [])]

        try:
            mp3s = link_to_mp3(downloads)
            
            jsons = transcribe_audios(mp3s)
            
            to_embeddings(jsons)
            
            embeddings_ready = True
            return jsonify({"status": "success", "message": f"{chatbot_name} is ready! Ask your questions below."})
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)})

    return render_template('index.html', embeddings_ready=embeddings_ready)

@app.route('/ask', methods=['POST'])
def ask():
    if not embeddings_ready:
        return jsonify({"answer": "Embeddings not ready yet."})
    question = request.get_json().get("question")
    answer = chat_with_gemini(question)
    return jsonify({"answer": answer})

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)

