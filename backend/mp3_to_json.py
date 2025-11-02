import os
import json
import whisper
import subprocess
from pathlib import Path

def transcribe_audios(mp3_files):
    os.makedirs("jsons", exist_ok=True)
    os.makedirs("audios", exist_ok=True)

    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
    except Exception:
        common_paths = [
            r"C:\ffmpeg\bin",
            r"C:\Program Files\FFmpeg\bin",
            r"C:\Program Files (x86)\FFmpeg\bin"
        ]
        for p in common_paths:
            ffmpeg_exe = Path(p) / "ffmpeg.exe"
            if ffmpeg_exe.exists():
                os.environ["PATH"] += os.pathsep + str(p)

    model = whisper.load_model("small")

    for file in mp3_files:
        if isinstance(file, tuple):  
            file = file[0]

        audio_name = os.path.splitext(os.path.basename(file))[0]
        print(f"🎧 Transcribing {audio_name}...")

        result = model.transcribe(audio=file, language="ur", task="translate", word_timestamps=False)

        chunks = [
            {
                "audio name": audio_name,
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"]
            }
            for seg in result["segments"]
        ]

        json_path = f"jsons/{audio_name}.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump({"chunks": chunks, "text": result["text"]}, f, ensure_ascii=False, indent=2)

        print(f"✅ Saved: {json_path}")

    return [f"jsons/{os.path.splitext(os.path.basename(f[0] if isinstance(f, tuple) else f))[0]}.json" for f in mp3_files]
