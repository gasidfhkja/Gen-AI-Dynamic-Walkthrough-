// Walkthrough.js - AI Walkthrough Generator for Local Use

// OpenAI API Key (Replace with your actual key)
const OPENAI_API_KEY = ""; // Replace with a valid OpenAI API key

// ================================================
// Utility functions to load external CSS and JS files
// ================================================
function loadCSS(url) {
    return new Promise((resolve, reject) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        link.onload = () => resolve(url);
        link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
        document.head.appendChild(link);
    });
}

function loadJS(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = () => resolve(url);
        script.onerror = () => reject(new Error(`Failed to load JS: ${url}`));
        document.head.appendChild(script);
    });
}

// ================================================
// Load required dependencies:
// - Font Awesome CSS
// - Intro.js CSS
// - Intro.js JS
// ================================================
function loadDependencies() {
    return Promise.all([
        loadCSS("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"),
        loadCSS("https://cdnjs.cloudflare.com/ajax/libs/intro.js/7.0.1/introjs.min.css"),
        loadJS("https://cdnjs.cloudflare.com/ajax/libs/intro.js/7.0.1/intro.min.js")
    ]);
}

// ================================================
// UI Injection: Floating Icon & Query Modal
// ================================================
function injectUI() {
    if (document.getElementById("floating-icon")) return; // Prevent duplicate UI injection

    // Create and inject the floating icon
    const floatingIcon = document.createElement("div");
    floatingIcon.id = "floating-icon";
    
    // Using SVG for the neon yellow arrow logo
    floatingIcon.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="neon-arrow">
            <path d="M4 12L20 12M20 12L13 5M20 12L13 19" stroke="#f5cc00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    document.body.appendChild(floatingIcon);

    // Create and inject the modal dialog
    const modal = document.createElement("div");
    modal.id = "query-modal";
    modal.innerHTML = `
        <div id="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-lightbulb"></i> AI Walkthrough Generator</h3>
                <button id="close-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <p>What would you like to learn about this page?</p>
                <div class="input-container">
                    <i class="fas fa-search"></i>
                    <input type="text" id="walkthrough-input" placeholder="e.g., How do I add a teammate?" />
                </div>
            </div>
            <div class="modal-footer">
                <button id="generate-walkthrough">
                    <i class="fas fa-wand-magic-sparkles"></i> Generate Guide
                </button>
            </div>
            <div id="loading-indicator" style="display: none;">
                <div class="spinner"></div>
                <p>Generating your personalized guide...</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Inject additional styles
    const style = document.createElement("style");
    style.innerHTML = `
        :root {
            --primary-color: #f5cc00;
            --bg-dark: #121212;
            --bg-light: #1e1e1e;
            --text-color: #ffffff;
            --border-radius: 12px;
            --neon-glow: 0 0 10px rgba(245, 204, 0, 0.7), 0 0 20px rgba(245, 204, 0, 0.5), 0 0 30px rgba(245, 204, 0, 0.3);
        }
        
        #floating-icon {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--bg-dark);
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 0 15px rgba(245, 204, 0, 0.3), 
                        0 0 5px rgba(245, 204, 0, 0.1),
                        inset 0 0 10px rgba(0, 0, 0, 0.2);
            border: 2px solid var(--primary-color);
            transition: all 0.3s ease;
            padding: 0;
        }
        
        .neon-arrow {
            width: 30px;
            height: 30px;
            filter: drop-shadow(var(--neon-glow));
        }
        
        .neon-arrow path {
            stroke: var(--primary-color);
            stroke-width: 2;
        }
        
        #floating-icon:hover {
            transform: scale(1.1);
            box-shadow: 0 0 20px rgba(245, 204, 0, 0.5), 
                        0 0 10px rgba(245, 204, 0, 0.2);
        }
        
        #floating-icon:hover .neon-arrow {
            filter: drop-shadow(0 0 15px rgba(245, 204, 0, 0.9)) drop-shadow(0 0 25px rgba(245, 204, 0, 0.7));
        }
        
        #query-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
        }
        
        #modal-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bg-dark);
            color: var(--text-color);
            border-radius: var(--border-radius);
            width: 420px;
            box-shadow: 0 0 30px rgba(245, 204, 0, 0.2);
            border: 1px solid var(--primary-color);
            overflow: hidden;
        }
        
        .modal-header {
            background: var(--bg-light);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(245, 204, 0, 0.3);
            border-radius: var(--border-radius) var(--border-radius) 0 0;
        }
        
        .modal-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--primary-color);
            display: flex;
            align-items: center;
            gap: 10px;
            text-shadow: 0 0 8px rgba(245, 204, 0, 0.4);
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .modal-footer {
            padding: 15px 20px;
            border-top: 1px solid rgba(245, 204, 0, 0.3);
            display: flex;
            justify-content: flex-end;
            border-radius: 0 0 var(--border-radius) var(--border-radius);
        }
        
        .input-container {
            position: relative;
            margin-top: 15px;
        }
        
        .input-container i {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: rgba(255, 255, 255, 0.5);
        }
        
        #walkthrough-input {
            width: 100%;
            padding: 12px 15px 12px 40px;
            border-radius: 50px;
            background: var(--bg-light);
            border: 1px solid rgba(245, 204, 0, 0.3);
            color: var(--text-color);
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        #walkthrough-input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 2px rgba(245, 204, 0, 0.2);
        }
        
        #walkthrough-input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }
        
        #generate-walkthrough {
            background: linear-gradient(135deg, rgba(245, 204, 0, 0.8), rgba(245, 204, 0, 1));
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 50px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        
        #generate-walkthrough:hover {
            background: linear-gradient(135deg, rgba(245, 204, 0, 1), rgba(245, 204, 0, 0.8));
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), 0 0 15px rgba(245, 204, 0, 0.3);
        }
        
        #close-modal {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            font-size: 16px;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        #close-modal:hover {
            color: var(--primary-color);
            transform: rotate(90deg);
        }
        
        #loading-indicator {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(18, 18, 18, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2;
            border-radius: var(--border-radius);
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(245, 204, 0, 0.3);
            border-radius: 50%;
            border-top-color: var(--primary-color);
            animation: spin 1s ease-in-out infinite;
            margin-bottom: 15px;
            box-shadow: 0 0 10px rgba(245, 204, 0, 0.3);
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Intro.js customization */
        .introjs-tooltip {
            background: var(--bg-dark) !important;
            color: var(--text-color) !important;
            border: 1px solid var(--primary-color) !important;
            box-shadow: 0 0 15px rgba(245, 204, 0, 0.2) !important;
            border-radius: var(--border-radius) !important;
        }
        
        .introjs-button {
            background: var(--bg-light) !important;
            color: var(--primary-color) !important;
            border: 1px solid var(--primary-color) !important;
            border-radius: 50px !important;
            padding: 6px 15px !important;
        }
        
        .introjs-button:hover {
            background: var(--primary-color) !important;
            color: #000 !important;
            box-shadow: 0 0 10px rgba(245, 204, 0, 0.3) !important;
        }
        
        .introjs-helperLayer {
            border: 3px solid var(--primary-color) !important;
            box-shadow: 0 0 0 1000px rgba(0, 0, 0, .7) !important;
            border-radius: 8px !important;
        }
    `;
    document.head.appendChild(style);
}

// ================================================
// Extract Elements from the Page
// ================================================
function getWebsiteElements() {
    const elements = document.querySelectorAll("button, a, input, textarea, select, .menu li, .card--wrapper div, .tabular--wrapper table");
    return Array.from(elements).map((el, index) => ({
        id: el.id || `element-${index}`,
        tag: el.tagName.toLowerCase(),
        text: el.innerText || el.placeholder || el.value || "No Text",
        classList: [...el.classList],
        selector: getUniqueSelector(el)
    }));
}

// Generate a unique CSS selector for a given element
function getUniqueSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.classList.length > 0) return '.' + element.classList[0];
    return element.tagName.toLowerCase();
}

// ================================================
// Call the OpenAI API to Generate Walkthrough Steps
// ================================================
async function generateWalkthrough(userInput) {
    // Show loading state
    document.getElementById("loading-indicator").style.display = "flex";
    
    const elements = getWebsiteElements();

    const messages = [
        {
            "role": "system",
            "content": `You are an assistant that generates an interactive Intro.js walkthrough. 
                        Given the user's query and available website elements, return a step-by-step guide in JSON format ONLY.
                        Ensure that:
                        - 'element' contains a valid CSS selector from the provided elements.
                        - 'intro' is a brief explanation.
                        - Return ONLY a JSON array.`
        },
        {
            "role": "user",
            "content": `Website elements: ${JSON.stringify(elements)}`
        },
        {
            "role": "user",
            "content": `User query: ${userInput}`
        }
    ];

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4-turbo",
                messages: messages,
                max_tokens: 500,
                temperature: 0.5
            })
        });

        // Hide loading state
        document.getElementById("loading-indicator").style.display = "none";

        // Handle API errors
        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ OpenAI API Error:", errorData);
            showNotification("error", `OpenAI API Error: ${errorData.error.message || "Unknown error"}`);
            return [];
        }

        // Log full response for debugging
        const data = await response.json();
        console.log("🔍 Full API Response:", data);

        // Parse JSON response safely
        let generatedSteps;
        try {
            generatedSteps = JSON.parse(data.choices[0].message.content.trim());
        } catch (parseError) {
            console.error("⚠️ Error parsing OpenAI response:", parseError);
            showNotification("error", "Failed to parse AI response.");
            return [];
        }

        // Validate JSON structure
        if (!Array.isArray(generatedSteps) || generatedSteps.length === 0) {
            console.error("⚠️ No valid steps returned.");
            showNotification("error", "Sorry, no valid walkthrough steps were generated.");
            return [];
        }

        console.log("🔍 Walkthrough Steps:", generatedSteps);
        showNotification("success", `Created a ${generatedSteps.length}-step guide!`);
        return generatedSteps;

    } catch (error) {
        // Hide loading state
        document.getElementById("loading-indicator").style.display = "none";
        
        console.error("❌ Network/API Error:", error);
        showNotification("error", "Failed to connect to OpenAI. Check API key and internet connection.");
        return [];
    }
}

// ================================================
// Notification System
// ================================================
function showNotification(type, message) {
    // Remove any existing notification
    const existingNotification = document.getElementById("walkthrough-notification");
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement("div");
    notification.id = "walkthrough-notification";
    notification.className = `notification ${type}`;
    
    // Set icon based on type
    let icon = "info-circle";
    if (type === "success") icon = "check-circle";
    if (type === "error") icon = "exclamation-triangle";
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // Style the notification
    const style = document.createElement("style");
    style.innerHTML = `
        #walkthrough-notification {
            position: fixed;
            bottom: 20px;
            left: 20px;
            padding: 12px 20px;
            border-radius: 50px;
            color: white;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 10px rgba(245, 204, 0, 0.2);
            z-index: 10001;
            animation: slideIn 0.3s forwards, fadeOut 0.5s 3.5s forwards;
            max-width: 300px;
        }
        
        @keyframes slideIn {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; visibility: hidden; }
        }
        
        .notification.success {
            background: #1e1e1e;
            border-left: 4px solid var(--primary-color);
        }
        
        .notification.error {
            background: #1e1e1e;
            border-left: 4px solid #ff3b30;
        }
        
        .notification.info {
            background: #1e1e1e;
            border-left: 4px solid #007aff;
        }
    `;
    document.head.appendChild(style);
    
    // Add to body and auto-remove after 4 seconds
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

// ================================================
// Initialize the Walkthrough
// ================================================
function initWalkthrough() {
    injectUI();

    // Open modal when floating icon is clicked
    document.getElementById("floating-icon").addEventListener("click", function () {
        document.getElementById("query-modal").style.display = "block";
        document.getElementById("walkthrough-input").focus();
    });

    // Close modal when clicking outside of content
    document.getElementById("query-modal").addEventListener("click", function (event) {
        if (event.target === this) {
            this.style.display = "none";
        }
    });

    // Close modal when close button is clicked
    document.getElementById("close-modal").addEventListener("click", function() {
        document.getElementById("query-modal").style.display = "none";
    });

    // Enable Enter key to submit
    document.getElementById("walkthrough-input").addEventListener("keyup", function(event) {
        if (event.key === "Enter") {
            document.getElementById("generate-walkthrough").click();
        }
    });

    // Generate walkthrough when button is clicked
    document.getElementById("generate-walkthrough").addEventListener("click", async function () {
        const userInput = document.getElementById("walkthrough-input").value.trim();
        if (!userInput) {
            showNotification("info", "Please enter a query.");
            return;
        }

        document.getElementById("query-modal").style.display = "none";
        
        const generatedSteps = await generateWalkthrough(userInput);
        if (generatedSteps.length > 0) {
            introJs().setOptions({
                steps: generatedSteps,
                showBullets: true,
                showProgress: true,
                nextLabel: 'Next →',
                prevLabel: '← Back',
                doneLabel: 'Finish',
                tooltipClass: 'customTooltip'
            }).start();
        }
    });
}

// ================================================
// When the DOM is ready, load dependencies then initialize the walkthrough
// ================================================
document.addEventListener("DOMContentLoaded", function() {
    loadDependencies()
        .then(() => {
            initWalkthrough();
            showNotification("info", "AI Walkthrough Generator loaded! Click the arrow icon to start.");
        })
        .catch((error) => {
            console.error("Error loading dependencies:", error);
            showNotification("error", "Failed to load walkthrough generator dependencies.");
        });
});