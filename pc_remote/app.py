from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
import pyautogui
import os
import subprocess

app = Flask(__name__)
app.config['SECRET_KEY'] = 'super_secret_key'
# Running without eventlet async_mode to ensure full compatibility with Python 3.13+
socketio = SocketIO(app, cors_allowed_origins="*")

# Disable pyautogui pause to make the mouse movement smoother
pyautogui.PAUSE = 0

# --- HTTP ROUTES (For initial load, apps, and shutdown) ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/shutdown', methods=['POST'])
def shutdown():
    # Windows command to shut down the PC in 1 second
    os.system("shutdown /s /t 1")
    return jsonify({"status": "shutdown initiated"})

@app.route('/launch/<app_name>', methods=['POST'])
def launch_app(app_name):
    try:
        if app_name == 'brave':
            subprocess.Popen(["C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"])
        elif app_name == 'vscode':
            # Automatically configured for your Windows username 'guido'
            subprocess.Popen(["C:\\Users\\guido\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe"])
        return jsonify({"status": f"{app_name} launched"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- WEBSOCKETS (For real-time mouse, drag, and keyboard interaction) ---

@socketio.on('mouse_move')
def handle_mouse_move(data):
    dx = data.get('dx', 0)
    dy = data.get('dy', 0)
    pyautogui.move(dx, dy)

@socketio.on('mouse_click')
def handle_mouse_click(data):
    button = data.get('button', 'left')
    pyautogui.click(button=button)

@socketio.on('mouse_down')
def handle_mouse_down(data):
    # Holds down the specified mouse button (essential for drag & drop)
    button = data.get('button', 'left')
    pyautogui.mouseDown(button=button)

@socketio.on('mouse_up')
def handle_mouse_up(data):
    # Releases the specified mouse button (essential to complete drag & drop)
    button = data.get('button', 'left')
    pyautogui.mouseUp(button=button)

@socketio.on('keyboard_type')
def handle_keyboard_type(data):
    text = data.get('text', '')
    pyautogui.write(text)
    pyautogui.press('enter')

@socketio.on('keyboard_backspace')
def handle_keyboard_backspace():
    pyautogui.press('backspace')

@socketio.on('keyboard_enter')
def handle_keyboard_enter():
    # Presses a single Enter key on the host computer
    pyautogui.press('enter')

if __name__ == '__main__':
    # Host 0.0.0.0 opens the server to your local network on port 5000
    socketio.run(app, host='0.0.0.0', port=5000)