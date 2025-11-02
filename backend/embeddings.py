import os
import json
import pandas as pd
import joblib
from dotenv import load_dotenv
from openai import OpenAI
from backend.mp3_to_json import transcribe_audios



def create_embedding(text_list):
    load_dotenv()
    API_KEY = os.getenv("OPENROUTER_API_KEY")


    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=API_KEY,
    )
    response = client.embeddings.create(
        model="openai/text-embedding-3-small",
        input=text_list
    )
    return [d.embedding for d in response.data]

def to_embeddings(downloads):
    os.makedirs("jsons", exist_ok=True)
    os.makedirs("audios", exist_ok=True)

    all_chunks, chunk_id = [], 0
    for json_file in os.listdir("jsons"):
        with open(f"jsons/{json_file}", "r", encoding="utf-8") as f:
            contents = json.load(f)

        print(f"Creating embeddings for {json_file} ...")
        texts = [c["text"] for c in contents["chunks"]]
        embeddings = create_embedding(texts)

        for i, chunk in enumerate(contents["chunks"]):
            chunk["chunks_id"] = chunk_id
            chunk["chunks_embeddings"] = embeddings[i]
            chunk_id += 1
            all_chunks.append(chunk)

    df = pd.DataFrame(all_chunks)
    joblib.dump(df, "embeddings.joblib")
    return df

if __name__ == "__main__":
    downloads = [("https://youtu.be/Lt0iZi50Vpw?si=ctUT1TizqiB48r29", "harry")]
    df = to_embeddings(downloads)
    print(df.head())
