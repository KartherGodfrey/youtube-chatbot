document.addEventListener("DOMContentLoaded", () => {
  const addVideoBtn = document.getElementById("add_video");
  const trainBtn = document.getElementById("train_btn");
  const videoInputs = document.getElementById("video_inputs");
  const loader = document.getElementById("loader");
  const statusText = document.getElementById("status");

  const chatSection = document.getElementById("chat-section");
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");

  // Add more video fields
  addVideoBtn.addEventListener("click", () => {
    const group = document.createElement("div");
    group.classList.add("video-group");
    group.innerHTML = `<input placeholder="YouTube URL"><input placeholder="Video Name">`;
    videoInputs.appendChild(group);
  });

  // Train chatbot
  trainBtn.addEventListener("click", async () => {
    const chatbotName = document.getElementById("chatbot_name").value.trim();
    const groups = document.querySelectorAll(".video-group");
    if (!chatbotName) { alert("Enter chatbot name."); return; }

    const downloads = [];
    groups.forEach(g => {
      const inputs = g.querySelectorAll("input");
      const url = inputs[0].value.trim();
      const name = inputs[1].value.trim();
      if (url && name) downloads.push({ url, name });
    });
    if (downloads.length === 0) { alert("Add at least one video."); return; }

    loader.classList.remove("hidden");
    statusText.textContent = "Training in progress... ⏳";

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ chatbot_name: chatbotName, downloads })
      });
      const data = await response.json();
      loader.classList.add("hidden");
      statusText.textContent = data.message;

      if (data.status === "success") {
        document.getElementById("setup-section").classList.add("hidden");
        chatSection.classList.remove("hidden");
      }
    } catch (err) {
      loader.classList.add("hidden");
      statusText.textContent = "❌ Failed: " + err.message;
    }
  });

  // Chat functionality
  function appendMessage(sender, text) {
    const p = document.createElement("p");
    p.className = sender;
    p.textContent = `${sender === "user" ? "🧑 You" : "🤖 Bot"}: ${text}`;
    chatBox.appendChild(p);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function sendMessage() {
    const question = userInput.value.trim();
    if (!question) return;
    appendMessage("user", question);
    userInput.value = "";

    loader.classList.remove("hidden");

    try {
      const response = await fetch("/ask", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ question })
      });
      const data = await response.json();
      loader.classList.add("hidden");
      appendMessage("bot", data.answer || "Sorry, I couldn't understand that.");
    } catch (err) {
      loader.classList.add("hidden");
      appendMessage("bot", "⚠️ Error connecting to server.");
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  userInput.addEventListener("keypress", e => { if(e.key==="Enter") sendMessage(); });
});
