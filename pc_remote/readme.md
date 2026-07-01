# PC Remote : Architecture, Network Protocol, and Deployment Documentation

PC Remote  is a self-hosted, low-latency remote control ecosystem designed to interface mobile devices with a host Windows machine over a local area network (LAN). Optimized specifically for modern high-density touchscreen devices, such as Samsung Galaxy flagships, the application transforms a smartphone into a wireless trackpad, command-injection keyboard, and application execution bridge.

The primary architectural goal of this project is the total elimination of the input lag and resource overhead inherent in cloud-reliant or video-streaming remote desktop solutions. By deploying a localized web view over HTTP and handling real-time peripheral emulation via WebSockets, input propagation executes in under 5 milliseconds.



## 1. System Architecture & Data Flow Lifecycle

The application operates on a decoupled, three-tier architecture that processes touch inputs on the client device and executes hardware-level interrupts on the host operating system.

```text
[Mobile Client Touchscreen] 
         │
         ▼ (JavaScript Touch Events / Relative Delta Calculations)
[Socket.IO Client Web Thread]
         │
         ▼ (Low-Latency WebSocket Packet over LAN: Port 5000)
[Flask-SocketIO Server Background Thread]
         │
         ▼ (Event Parsing & Coordinate Mapping)
[PyAutoGUI Hardware Emulation Layer]
         │
         ▼
[Windows OS Peripheral Input Queue]

```

### Component Breakdown

* **The Interaction Layer (Frontend):** A localized HTML5/CSS3 interface running a custom JavaScript abstraction layer. It listens for synchronous native touch coordinates (touchstart, touchmove, touchend), computes spatial vector deltas, and throttles network emissions to match the host monitor's refresh cycle.
* **The Transport Layer (Network):** Powered by Gevent-WebSocket and Flask-SocketIO. It replaces traditional stateless HTTP polling with a persistent, full-duplex TCP pipe, allowing raw coordinate matrices to stream seamlessly without connection handshake overhead.
* **The Execution Layer (Backend):** A multi-threaded Python core that catches abstract network packets and binds them to native OS input subroutines via Windows API hooks managed by PyAutoGUI.



## 2. UI Design Architecture: Resolving Mobile Gesture Conflicts

A critical flaw when using standard web views for desktop emulation is mobile operating system interference. Modern Android layers (particularly Samsung One UI) utilize global edge-swipe gestures for navigation (Home, Back, Recent Apps) that heavily conflict with standard user interactions inside a mobile browser.

PC Remote resolves these hardware-level layout barriers through structural CSS/JS inversion:

* **Inverted Control Topography:** All primary interactive surfaces—such as mouse click buttons, systemic hotkeys, and app initialization shortcuts—are positioned strictly inside the top 35% of the viewport. This places critical tap targets out of reach of the phone's bottom-edge navigation handlers.
* **Isolated Trapping Grid:** The lower 65% of the mobile interface is reserved exclusively for the virtual trackpad. By binding event listeners directly to this structural block and enforcing the touch-action: none CSS rule, all browser-level gestures, pinch-to-zoom actions, and mobile OS navigation overrides are explicitly suppressed.
* **Inline Vector Asset Optimization:** To guarantee instantaneous loading states and crisp rendering on high-DPI AMOLED smartphone panels, application execution shortcuts (such as Brave Browser and Visual Studio Code) discard standard image assets (PNG/JPEG) entirely. They are embedded natively into the DOM structure as raw inline SVG vector paths, minimizing network latency by avoiding extra HTTP requests during client handshakes.



## 3. Network Protocol & WebSocket Event Mapping

Communication between the mobile client and the Python backend relies on a strictly defined JSON payload schema over WebSockets. The table below outlines the core event protocol mapping:

| Event Name | Payload Structure | Technical Description | Backend Execution |
| --- | --- | --- | --- |
| `mouse_move` | `{"dx": float, "dy": float}` | Transmits relative directional movement deltas calculated from coordinate shifts on the phone trackpad. | Multiplies deltas by a scaling factor and invokes `pyautogui.moveRel(dx, dy)`. |
| `mouse_click` | `{"button": "left" | "right"}` | Dispatches explicit instructions to simulate a momentary mouse button down/up loop. | Invokes native OS hardware interrupt via `pyautogui.click(button=...)`. |
| `drag_state` | `{"active": boolean}` | Controls persistent mouse click locking states to facilitate window grabbing and asset movement. | If `true`, executes `pyautogui.mouseDown()`. If `false`, releases via `pyautogui.mouseUp()`. |
| `text_input` | `{"text": string}` | Forwards text blocks captured from the mobile input buffer to the host application. | Iterates through the payload string and injects characters using `pyautogui.write()`. |
| `system_key` | `{"key": "enter" | "backspace"}` | Triggers precise mechanical non-alphanumeric keystrokes. | Executes localized keyboard interrupts using `pyautogui.press(key)`. |
| `app_launch` | `{"app": "brave" | "vscode"}` | Commands the host machine to execute native binaries from the system path. | Spawns a decoupled background worker thread using `subprocess.Popen()`. |
| `sys_shutdown` | No payload | Signals a critical administrative system termination override. | Asserts root access rights and forces an immediate OS-level shutdown call. |



## 4. File Structure Profile

```text
pc_remote/
├── app.py                  # Multi-threaded Flask-SocketIO server & OS abstraction layer
├── avvio_silenzioso.vbs    # VBScript wrapper for headless background process virtualization
├── requirements.txt        # Managed Python environment dependency manifests
├── templates/
│   └── index.html          # Structural UI shell featuring optimized inline vector graphics
└── static/
    ├── style.css           # Inverted layout stylesheet featuring gesture safe-zone logic
    └── script.js           # Client-side input event loop and WebSocket state controller

```



## 5. Prerequisites & Core Environment Setup

The host infrastructure requires a valid Windows environment with the following dependencies configured:

* **Python 3.10+ (64-bit):** Ensure that the option "Add python.exe to PATH" is explicitly checked during installation.
* **Shared Network Topology:** The computer and the remote mobile device must be connected to the exact same physical router or local access point, capable of processing uninhibited intra-LAN TCP traffic.

### Environment Installation

Open a standard administrative terminal (PowerShell or Command Prompt) inside your project folder and run the environment installer:

```bash
pip install -r requirements.txt

```



## 6. Execution Modes & Startup Automation

### 1. Foreground Debugging Mode

To analyze performance metrics, monitor incoming real-time network packets, or modify layout parameters, launch the application via standard terminal execution:

```bash
python app.py

```

This forces the server to retain an active stdout stream, logging all relative movement vectors and client connection handshakes directly to the screen.

### 2. Headless Production Mode

To run the server seamlessly without cluttering your Windows desktop with an active command prompt window, double-click `avvio_silenzioso.vbs`.

This script invokes a silent Windows Script Host shell wrapper that initializes the Python backend inside a hidden window object (`0`), running the application as an invisible, highly efficient system daemon.

### 3. Automated Boot Configuration (Persistent System Service)

To configure PC Remote to activate automatically the moment you log into Windows, implement the following deployment path:

1. Press the `Windows Key + R` to open the native system run utility.
2. Input `shell:startup` into the dialogue field and press `Enter`. This actions launches the hidden user profile Startup folder.
3. Navigate to your project development directory, right-click the `avvio_silenzioso.vbs` file, and select **Create shortcut**.
4. Move the newly generated shortcut file directly into the **Startup** directory opened in step 2.

The utility will now boot silently in the background on every subsequent system initialization.



## 7. Connecting Your Mobile Device

1. Determine your host computer's internal local network IP address by executing `ipconfig` inside a terminal. Look for your active network card's `IPv4 Address` (typically structured as `192.168.1.XX` or `10.0.0.XX`).
2. Open the mobile web browser on your smartphone.
3. Direct the browser to your machine's private network location using port 5000 (e.g., `http://192.168.1.45:5000`).
4. To eliminate web browser address bars and maximize vertical tracking boundaries, open your mobile browser menu and select **"Add to Home Screen"**. This forces the interface to render as a standalone Progressive Web Application (PWA) shell.


## 8. Process Management: Terminating the Hidden Server

Because production deployment drops the backend into an invisible execution state without a terminal window, standard termination sequences (`Ctrl + C`) are unavailable. The server process must be removed from memory using specific operating system routines.

### Method A: Manual Termination via Windows Task Manager

1. Launch the Task Manager using the shortcut `Ctrl + Shift + Esc`.
2. If the interface is minimized, click **More details** at the bottom left.
3. Navigate to the **Processes** tab and scroll down to the **Background processes** cluster.
4. Locate the instance labeled **Python** or `python.exe`.
5. Select the targeted row and click **End task** in the bottom-right action area to free port 5000.

### Method B: Automated Forced Kill via Command Line

For instantaneous, script-based process termination, run this command inside an administrative command prompt or PowerShell instance:

```cmd
taskkill /f /im python.exe

```

This instantly targets the Windows process subsystem, sending a termination signal to all background threads managed by the Python binary.



## 9. Troubleshooting & Edge Cases

* **Issue: Mobile client times out or fails to load the web interface.**
* *Resolution:* Windows Defender Firewall frequently drops foreign inbound connections on unverified local ports. Open your advanced firewall settings and create an **Inbound Rule** allowing unrestricted TCP traffic on port 5000, or verify that your router does not have "AP Isolation" active on the Wi-Fi configuration.


* **Issue: Mouse cursor moves erratically or exhibits unnatural acceleration.**
* *Resolution:* Windows Display Scaling (DPI) can introduce arithmetic offsets into PyAutoGUI's absolute positioning engine. If your desktop scaling is set above 100%, adjust the mouse tracking sensitivity variables inside your client-side `script.js` to counteract the operating system's spatial multi-sampling.


* **Issue: App launcher fail states.**
* *Resolution:* The application launch paths inside `app.py` are explicitly hardcoded to standard installation structures. If your instances of Brave or VS Code are sandboxed or running out of custom system drives, update the environment strings inside the Python `launch_application` method to reflect your local binary paths.




## 10. Security Considerations

PC Remote  is architected purely as a personal utility and deliberately omits authentication, packet encryption, and SSL handshakes to prioritize minimal processing overhead.

Because the WebSocket server interprets and executes raw shell inputs and hardware-level keyboard injections without token validation, **do not execute this application on public, unencrypted, or untrusted Wi-Fi networks**. The application should only be initialized within tightly controlled private network infrastructure.

```

```