import pandas as pd
import joblib
import numpy as np
import requests
from sklearn.metrics.pairwise import cosine_similarity
from backend.embeddings import to_embeddings
from backend.embeddings import create_embedding
from dotenv import load_dotenv
import os
import json


def inference(prompt):
    load_dotenv()
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    data = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }

    response = requests.post(url, headers=headers, data=json.dumps(data))
    response.raise_for_status()

    result = response.json()
    output_text = result["candidates"][0]["content"]["parts"][0]["text"]
    return output_text


def chat_with_gemini(user_query, df_path="embeddings.joblib", top_results=5):
    df = joblib.load(df_path)

    question_embedding = create_embedding([user_query])[0]

    similarities = cosine_similarity(
        np.vstack(df["chunks_embeddings"]), [question_embedding]
    ).flatten()

    top_idx = similarities.argsort()[::-1][:top_results]
    selected = df.loc[top_idx]

    context = "\n".join(
        [f"[{r['start']} - {r['end']}] {r['text']}" for _, r in selected.iterrows()]
    )

    prompt = f"""
You are a helpful chatbot trained on Youtube videos.
Answer the user's question clearly and precisely using the most relevant transcript below.

Context:
{context}

Question:
{user_query}
"""

    response = inference(prompt)
    return response


if __name__ == "__main__":
    query = input("Ask a question: ")
    answer = chat_with_gemini(query)
