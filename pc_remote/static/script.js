const socket = io();

// --- VIEW NAVIGATION CONTROLLER ---
const btnMouseMode = document.getElementById('btnMouseMode');
const btnKeyboardMode = document.getElementById('btnKeyboardMode');
const mouseView = document.getElementById('mouseView');
const keyboardView = document.getElementById('keyboardView');

btnMouseMode.addEventListener('click', () => {
    btnMouseMode.classList.add('active');
    btnKeyboardMode.classList.remove('active');
    mouseView.classList.remove('hidden');
    keyboardView.classList.add('hidden');
});

btnKeyboardMode.addEventListener('click', () => {
    btnKeyboardMode.classList.add('active');
    btnMouseMode.classList.remove('active');
    keyboardView.classList.remove('hidden');
    mouseView.classList.add('hidden');
});

// --- VIRTUAL KEYBOARD ACTIONS ---
const textInput = document.getElementById('textInput');
const btnEnter = document.getElementById('btnEnter');
const btnBackspace = document.getElementById('btnBackspace');

// Function to send text when pressing Enter on the phone keyboard
textInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendTextAction();
    }
});

// Logic for the visual ENTER button
btnEnter.addEventListener('click', () => {
    sendTextAction();
});

function sendTextAction() {
    const text = textInput.value;
    if (text.length > 0) {
        socket.emit('keyboard_type', { text: text });
        textInput.value = ''; // Clears input box
    } else {
        // If the input is empty, it just presses Enter on the PC
        socket.emit('keyboard_enter');
    }
}

// Logic for the BACKSPACE button
btnBackspace.addEventListener('click', () => {
    socket.emit('keyboard_backspace');
});

// --- APP LAUNCH & SHUTDOWN MODAL ---
function launchApp(appName) {
    fetch(`/launch/${appName}`, { method: 'POST' });
}

const modal = document.getElementById('shutdownModal');
document.getElementById('btnShutdownInit').addEventListener('click', () => {
    modal.classList.remove('hidden');
});

function closeModal() {
    modal.classList.add('hidden');
}

function confirmShutdown() {
    fetch('/shutdown', { method: 'POST' });
    closeModal();
}

// --- TRACKPAD & DRAG N DROP EMULATION ---
const trackpad = document.getElementById('trackpad');
const btnDrag = document.getElementById('btnDrag');
let lastX = 0;
let lastY = 0;
let isDragging = false; // Drag state tracker

// Drag & Drop toggle button logic
btnDrag.addEventListener('click', () => {
    isDragging = !isDragging;
    
    if (isDragging) {
        btnDrag.classList.add('drag-active');
        btnDrag.innerText = "DROP (MOUSE DOWN)";
        socket.emit('mouse_down', { button: 'left' }); // Holds down left click
    } else {
        btnDrag.classList.remove('drag-active');
        btnDrag.innerText = "DRAG & DROP";
        socket.emit('mouse_up', { button: 'left' });   // Releases left click
    }
});

trackpad.addEventListener('touchstart', (e) => {
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
});

trackpad.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Lock mobile scrolling
    
    let currentX = e.touches[0].clientX;
    let currentY = e.touches[0].clientY;
    
    let dx = currentX - lastX;
    let dy = currentY - lastY;
    
    let sensitivity = 1.4;

    socket.emit('mouse_move', { dx: dx * sensitivity, dy: dy * sensitivity });
    
    lastX = currentX;
    lastY = currentY;
});

function sendClick(buttonType) {
    socket.emit('mouse_click', { button: buttonType });
}