// Global variables
let embeddingsReady = false;

// Splash screen functionality
window.addEventListener('load', function() {
  const splashScreen = document.getElementById('splash-screen');
  const landingPage = document.getElementById('landing-page');
  
  // Show splash screen for 2.5 seconds then transition to landing page
  setTimeout(function() {
    splashScreen.classList.add('fade-out');
    
    setTimeout(function() {
      splashScreen.style.display = 'none';
      landingPage.classList.remove('hidden');
      landingPage.classList.add('active');
      
      // Initialize particles after splash screen
      initParticles();
    }, 800);
  }, 2500);
});

/* ====== Particles (subtle) ====== */
function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  const particles = [];
  const PARTICLE_COUNT = Math.max(18, Math.floor((w*h)/100000));

  function rand(min,max){ return Math.random()*(max-min)+min }
  function create(){
    for(let i=0;i<PARTICLE_COUNT;i++){
      particles.push({
        x: rand(0,w), y: rand(0,h),
        r: rand(0.6,2.2),
        vx: rand(-0.15,0.15), vy: rand(-0.05,0.05),
        alpha: rand(0.06,0.18)
      })
    }
  }
  function resize(){ w=canvas.width = innerWidth; h=canvas.height = innerHeight; particles.splice(0); create() }
  function draw(){
    ctx.clearRect(0,0,w,h);
    for(const p of particles){
      p.x += p.vx; p.y += p.vy;
      if(p.x< -10) p.x = w+10;
      if(p.x> w+10) p.x = -10;
      if(p.y< -10) p.y = h+10;
      if(p.y> h+10) p.y = -10;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0,255,151,'+p.alpha+')';
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  create(); draw();
  addEventListener('resize', resize);
}

/* ====== Page Navigation ====== */
const landingPage = document.getElementById('landing-page');
const trainPage = document.getElementById('train-page');
const chatPage = document.getElementById('chat-page');

const getStarted = document.getElementById('getStarted');
const learnMore = document.getElementById('learnMore');
const backToLanding = document.getElementById('back-to-landing');
const backToTrain = document.getElementById('back-to-train');

// Navigation functions
function showPage(page) {
  // Hide all pages
  landingPage.classList.add('hidden');
  landingPage.classList.remove('active');
  trainPage.classList.add('hidden');
  trainPage.classList.remove('active');
  chatPage.classList.add('hidden');
  chatPage.classList.remove('active');
  
  // Show target page
  page.classList.remove('hidden');
  setTimeout(() => {
    page.classList.add('active');
  }, 50);
}

// Event listeners for navigation
getStarted.addEventListener('click', () => {
  showPage(trainPage);
});

learnMore.addEventListener('click', () => {
  alert('This application allows you to train a chatbot on YouTube videos. Add video URLs, give them names, and the system will download, transcribe, and create embeddings for them. You can then chat with the AI about the video content.');
});

backToLanding.addEventListener('click', () => {
  showPage(landingPage);
});

backToTrain.addEventListener('click', () => {
  showPage(trainPage);
});

/* ====== Training Page Interactions ====== */
const setupPanel = document.getElementById('setup');
const training = document.getElementById('training');
const trainBtn = document.getElementById('trainBtn');
const addVideo = document.getElementById('addVideo');
const videoList = document.getElementById('videoList');
const chatbotName = document.getElementById('chatbotName');
const chatbotTitle = document.getElementById('chatbot-title');
const trainingStatus = document.getElementById('training-status');
const chatStatus = document.getElementById('chat-status');

// Add new video input row
addVideo.addEventListener('click', () => {
  const div = document.createElement('div');
  div.className = 'video-item';
  div.innerHTML = `
    <input class="input-sm input youtube-url" placeholder="YouTube URL (https://...)" />
    <input class="input-sm input video-name" placeholder="Friendly name (e.g. Lecture 1)" />
  `;
  videoList.appendChild(div);
  div.querySelector('.youtube-url').focus();
});

// Train chatbot with actual backend
trainBtn.addEventListener('click', async () => {
  // Basic client-side validation
  const rows = document.querySelectorAll('.video-item');
  const downloads = [];
  
  // Collect video data
  rows.forEach(row => {
    const url = row.querySelector('.youtube-url').value.trim();
    const name = row.querySelector('.video-name').value.trim();
    if (url && name) {
      downloads.push({ url, name });
    }
  });
  
  if (downloads.length === 0) {
    alert('Please add at least one YouTube URL with a friendly name.');
    return;
  }
  
  const name = chatbotName.value.trim();
  if (!name) {
    alert('Please enter a chatbot name.');
    return;
  }
  
  // Update chatbot title
  chatbotTitle.textContent = name;
  
  // Show training overlay
  training.classList.add('show');
  trainingStatus.textContent = 'Starting training process...';
  
  try {
    // Send training request to backend
    const response = await fetch('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatbot_name: name,
        downloads: downloads
      })
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      // Training successful
      trainingStatus.textContent = result.message;
      embeddingsReady = true;
      chatStatus.textContent = 'Ready';
      
      // Wait a moment then navigate to chat page
      setTimeout(() => {
        training.classList.remove('show');
        showPage(chatPage);
      }, 1500);
    } else {
      // Training failed
      trainingStatus.textContent = `Error: ${result.message}`;
      setTimeout(() => {
        training.classList.remove('show');
      }, 3000);
    }
  } catch (error) {
    console.error('Training error:', error);
    trainingStatus.textContent = 'Error connecting to server. Please try again.';
    setTimeout(() => {
      training.classList.remove('show');
    }, 3000);
  }
});

/* ========== Chat functionality with backend ========== */
const chatBox = document.getElementById('chatBox');
const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');

function appendMessage(kind, text, opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + (kind === 'bot' ? 'bot' : 'user');
  const bubble = document.createElement('div');
  bubble.className = 'bubble ' + (kind === 'bot' ? 'bot' : 'user');
  bubble.textContent = text;
  wrap.appendChild(bubble);
  chatBox.appendChild(wrap);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
  const wrap = document.createElement('div');
  wrap.className = 'msg bot';
  wrap.setAttribute('data-typing', '1');
  const typingBubble = document.createElement('div');
  typingBubble.className = 'typing';
  typingBubble.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  wrap.appendChild(typingBubble);
  chatBox.appendChild(wrap);
  chatBox.scrollTop = chatBox.scrollHeight;
  return wrap;
}

async function handleUserSend() {
  const text = userInput.value.trim();
  if (!text) return;
  
  appendMessage('user', text);
  userInput.value = '';
  userInput.disabled = true;
  sendBtn.disabled = true;

  // Show typing indicator
  const typingNode = showTyping();

  try {
    // Send question to backend
    const response = await fetch('/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: text
      })
    });
    
    const result = await response.json();
    
    // Remove typing indicator
    typingNode.remove();
    
    // Display response
    appendMessage('bot', result.answer);
  } catch (error) {
    console.error('Chat error:', error);
    typingNode.remove();
    appendMessage('bot', 'Sorry, there was an error processing your question. Please try again.');
  } finally {
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}

sendBtn.addEventListener('click', handleUserSend);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleUserSend();
});

/* Accessibility: focus */
document.addEventListener('keydown', (e) => {
  if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    userInput.focus();
  }
});