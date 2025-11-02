import os
import imageio_ffmpeg
import subprocess

downloads = []

def link_to_mp3(downloads):
    os.makedirs("audios", exist_ok=True)
    results = []
    ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()

    print("Downloads received:", downloads)

    for url, name in downloads:
        file_path = f"audios/{name}.mp3"
        command = [
            "yt-dlp",
            "-x",
            "--audio-format", "mp3",
            "--ffmpeg-location", ffmpeg_path,
            "-o", f"audios/{name}.%(ext)s",
            url
        ]
        try:
            # Use subprocess.run to check for errors
            subprocess.run(command, check=True)
            if os.path.exists(file_path):
                results.append(file_path)
                print(f"✅ Downloaded: {file_path}")
            else:
                print(f"❌ Failed to download (file missing): {url}")
        except subprocess.CalledProcessError:
            print(f"❌ Failed to download: {url}")

    return results

if __name__ == "__main__":
    link_to_mp3(downloads)
