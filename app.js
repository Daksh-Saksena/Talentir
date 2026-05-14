const DID_API_KEY = "YXdkcmVkcmVkcmVkNEBnbWFpbC5jb20:wK0dV_uWf36YPRQVI3yiq";
const GEMINI_API_KEY = "AIzaSyAzSjJzjXpjfbBWsOlcQvyNaDfG9G_K8Hs"; // User provided key

const TEACHERS = [
    { name: "Dr. Ray", url: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=500&h=700&fit=crop", voice: "en-US-AndrewMultilingualNeural" },
    { name: "Prof. Elena", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=500&h=700&fit=crop", voice: "en-US-EmmaMultilingualNeural" }
];

let currentTeacher = TEACHERS[Math.floor(Math.random() * TEACHERS.length)];
let peerConnection, streamId, sessionId;
let recognition, isListening = false;

// DOM Elements
const chatLog = document.getElementById('chat-log');
const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const thinking = document.getElementById('thinking');
const startBtn = document.getElementById('start-btn');
const micBtn = document.getElementById('mic-btn');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const videoElement = document.getElementById('video-element');
const videoPlaceholder = document.getElementById('video-placeholder');
const writingStatus = document.getElementById('writing-status');
const resourceOverlay = document.getElementById('resource-overlay');
const resourceContent = document.getElementById('resource-content');
const resourceTitle = document.getElementById('resource-title');

// PhET Slug Mapping
const PHET_SIMS = {
    'circuit': 'circuit-construction-kit-dc',
    'gravity': 'gravity-and-orbits',
    'projectile': 'projectile-motion',
    'energy': 'energy-skate-park-basics',
    'atom': 'build-an-atom',
    'forces': 'forces-and-motion-basics',
    'ohm': 'ohms-law',
    'gas': 'gas-properties',
    'waves': 'wave-on-a-string'
};

// Initialize
lucide.createIcons();
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    clearBoard();
}

function clearBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Chalkboard background is handled by CSS, we just clear the drawing layer
}

document.getElementById('clear-canvas').onclick = clearBoard;

// --- Whiteboard Engine ---

async function writeOnBoard(steps) {
    writingStatus.style.display = 'flex';
    clearBoard();
    
    let y = 80;
    const x = 60;
    
    for (let i = 0; i < steps.length; i++) {
        let text = steps[i].trim()
            .replace(/\$\$|\\\[|\\\]|\\\(|\\\)/g, '') // Strip LaTeX markers
            .replace(/\\text\{([\s\S]*?)\}/g, '$1') // Strip \text{}
            .replace(/\\/g, ''); // Strip remaining backslashes
        if (!text) continue;

        await new Promise(r => setTimeout(r, 600)); // Teacher "thinking" time
        
        ctx.font = "28px 'Kalam'";
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.shadowBlur = 4;
        ctx.shadowColor = "rgba(255,255,255,0.3)";
        
        // Animate character by character with "chalk" jitter
        for(let j=0; j <= text.length; j++) {
            const currentText = text.substring(0, j);
            
            // Clear only the line being written to avoid flickering
            ctx.clearRect(x - 5, y - 35, canvas.width - x, 50);
            
            // Draw text with slight jitter
            const jitterX = (Math.random() - 0.5) * 0.5;
            const jitterY = (Math.random() - 0.5) * 0.5;
            
            ctx.fillText(currentText, x + jitterX, y + jitterY);
            
            // Subtle chalk "dust" effect
            if (j > 0 && Math.random() > 0.7) {
                drawChalkDust(x + (j * 14), y);
            }

            await new Promise(r => setTimeout(r, 40 + Math.random() * 40));
        }
        
        y += 60;
        if (y > canvas.height - 60) {
            await new Promise(r => setTimeout(r, 1000));
            clearBoard();
            y = 80;
        }
    }
    
    writingStatus.style.display = 'none';
}

function drawChalkDust(x, y) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    for(let i=0; i<3; i++) {
        ctx.beginPath();
        ctx.arc(x + (Math.random()-0.5)*10, y + (Math.random()-0.5)*10, Math.random()*1.5, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();
}

// --- Resource & Simulation System ---

async function showResource(type, value) {
    resourceOverlay.classList.add('active');
    resourceContent.innerHTML = '<div class="flex items-center justify-center h-full text-cyan-400 mono animate-pulse">LOADING KNOWLEDGE...</div>';
    
    if (type === 'PHET') {
        const slug = PHET_SIMS[value.toLowerCase()] || value;
        resourceTitle.innerText = `Simulation: ${slug.replace(/-/g, ' ')}`;
        resourceContent.innerHTML = `
            <iframe src="https://phet.colorado.edu/sims/html/${slug}/latest/${slug}_all.html" 
                    width="100%" height="100%" scrolling="no" allowfullscreen 
                    style="border:none; border-radius:12px;"></iframe>`;
    } else if (type === 'WIKI') {
        resourceTitle.innerText = `Encyclopedia: ${value}`;
        try {
            const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(value)}&prop=pageimages&format=json&origin=*&pithumbsize=1000`);
            const data = await response.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            const imgUrl = pages[pageId].thumbnail ? pages[pageId].thumbnail.source : null;
            
            if (imgUrl) {
                resourceContent.innerHTML = `<img src="${imgUrl}" class="wiki-image" alt="${value}">`;
            } else {
                resourceContent.innerHTML = `<div class="p-8 text-center text-gray-500 mono">No visual data found for "${value}". Searching alternate archives...</div>`;
            }
        } catch (e) {
            resourceContent.innerHTML = `<div class="p-8 text-center text-red-400 mono">Connection error to Wikipedia archives.</div>`;
        }
    }
}

document.getElementById('close-resource').onclick = () => resourceOverlay.classList.remove('active');
document.getElementById('toggle-resource').onclick = () => resourceOverlay.classList.toggle('active');

// --- AI Logic ---

async function askAI(query) {
    thinking.classList.remove('hidden');
    log(query, 'user');

    if (!GEMINI_API_KEY) {
        log("Gemini API Key missing. Please set it in the console or code.", 'system');
        thinking.classList.add('hidden');
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: query }] }],
                systemInstruction: {
                    parts: [{ text: `You are ${currentTeacher.name}, a legendary JEE/STEM instructor.
                    Your goal is to teach with clarity, using visual aids.
                    
                    COMMANDS:
                    1. Use [BOARD]...[/BOARD] for math/physics steps. These will be animated on the chalkboard.
                    2. Use [PHET: slug] to trigger a simulation. Slugs: circuit, gravity, projectile, energy, atom, forces, ohm, gas, waves.
                    3. Use [WIKI: topic] to show a professional scientific image/diagram from Wikipedia.
                    
                    MATH NOTATION RULES:
                    - NEVER use LaTeX markers like $$, \[, or \(.
                    - Write math as you would on a real chalkboard (e.g., "x^2 + 5 = 10" or "F = m * a").
                    - Use simple exponents and fractions (e.g., 1/2 instead of \frac{1}{2}).
                    
                    GUIDELINES:
                    - Keep spoken words warm and encouraging (max 50 words).
                    - Use [BOARD] for any derivation.
                    - If a concept is visual, trigger a [PHET] or [WIKI] resource.
                    - Be professional and expert.` }]
                }
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            const errorMsg = data.error.message || "Unknown API Error";
            log(`API Error: ${errorMsg}`, 'system');
            if (data.error.status === "RESOURCE_EXHAUSTED") {
                log("Quota exceeded. Please check your Gemini API billing or wait for reset.", 'system');
            }
            thinking.classList.add('hidden');
            return;
        }

        const fullResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response content.";
        
        // 1. Parse Board
        const boardMatch = fullResponse.match(/\[BOARD\]([\s\S]*?)\[\/BOARD\]/);
        if (boardMatch) {
            const steps = boardMatch[1].trim().split('\n');
            writeOnBoard(steps);
        }

        // 2. Parse PHET
        const phetMatch = fullResponse.match(/\[PHET:\s*(.*?)\]/);
        if (phetMatch) showResource('PHET', phetMatch[1].trim());

        // 3. Parse WIKI
        const wikiMatch = fullResponse.match(/\[WIKI:\s*(.*?)\]/);
        if (wikiMatch) showResource('WIKI', wikiMatch[1].trim());

        // 4. Clean Speech
        const speech = fullResponse
            .replace(/\[BOARD\][\s\S]*?\[\/BOARD\]/g, '')
            .replace(/\[PHET:.*?\]/g, '')
            .replace(/\[WIKI:.*?\]/g, '')
            .trim();
            
        log(speech, 'ai');
        talk(speech);

    } catch (e) {
        log("Neural processing error.", 'system');
        console.error(e);
    } finally {
        thinking.classList.add('hidden');
    }
}

// --- D-ID & Voice Logic ---

async function startSession() {
    if (!GEMINI_API_KEY) {
        const key = prompt("Please enter your Gemini API Key:");
        if (key) window.GEMINI_API_KEY = key; // Simple way to set it
        else return;
    }

    log(`Establishing Neural Link...`);
    startBtn.disabled = true;
    statusIndicator.className = "w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse";

    try {
        const response = await fetch("https://api.d-id.com/talks/streams", {
            method: "POST",
            headers: { "Authorization": `Basic ${DID_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ source_url: currentTeacher.url })
        });

        const data = await response.json();
        streamId = data.id;
        sessionId = data.session_id;

        peerConnection = new RTCPeerConnection({ iceServers: data.ice_servers });
        peerConnection.ontrack = (e) => {
            if (e.track.kind === 'video') {
                videoElement.srcObject = e.streams[0];
                videoElement.classList.remove('hidden');
                videoPlaceholder.classList.add('hidden');
                statusIndicator.className = "w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]";
                statusText.innerText = "LINK ACTIVE";
                log(`Tutor online. Neural synchronization complete.`, 'system');
                startBtn.innerText = "ACTIVE";
            }
        };

        peerConnection.onicecandidate = (e) => {
            if (e.candidate) {
                fetch(`https://api.d-id.com/talks/streams/${streamId}/ice`, {
                    method: "POST",
                    headers: { "Authorization": `Basic ${DID_API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ ...e.candidate.toJSON(), session_id: sessionId })
                });
            }
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        await fetch(`https://api.d-id.com/talks/streams/${streamId}/sdp`, {
            method: "POST",
            headers: { "Authorization": `Basic ${DID_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ answer, session_id: sessionId })
        });

    } catch (err) {
        log("Uplink failed. Local fallback initialized.", 'system');
        startBtn.disabled = false;
        statusIndicator.className = "w-2.5 h-2.5 rounded-full bg-red-500";
    }
}

async function talk(text) {
    if (!streamId) {
        const synth = window.speechSynthesis;
        const utter = new SpeechSynthesisUtterance(text);
        synth.speak(utter);
        return;
    }
    try {
        await fetch(`https://api.d-id.com/talks/streams/${streamId}`, {
            method: "POST",
            headers: { "Authorization": `Basic ${DID_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                script: {
                    type: "text",
                    input: text,
                    provider: { type: "microsoft", voice_id: currentTeacher.voice }
                },
                session_id: sessionId
            })
        });
    } catch (e) {}
}

function log(msg, role='system') {
    const div = document.createElement('div');
    div.className = role === 'ai' ? "text-cyan-400 font-medium" : (role === 'user' ? "text-slate-300" : "text-gray-500 italic opacity-70");
    const label = role === 'ai' ? 'NEURAL' : (role === 'user' ? 'GUEST' : 'SYS');
    div.innerHTML = `<span class="opacity-40 font-black mr-2 text-[10px] tracking-widest">${label}:</span> ${msg}`;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// --- Voice Recognition ---

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => { micBtn.classList.add('mic-pulse', 'text-cyan-400'); isListening = true; };
    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        askAI(transcript);
    };
    recognition.onend = () => { micBtn.classList.remove('mic-pulse', 'text-cyan-400'); isListening = false; };
}

startBtn.onclick = startSession;
micBtn.onclick = () => {
    if (!recognition) return;
    if (!isListening) recognition.start();
    else recognition.stop();
};

// Expose GEMINI_API_KEY for easier setting
window.setApiKey = (key) => { window.GEMINI_API_KEY = key; log("API Key set.", 'system'); };
window.GEMINI_API_KEY = GEMINI_API_KEY;
