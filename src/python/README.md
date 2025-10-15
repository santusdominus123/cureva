# DJI Tello ROS2 Controller

Modern Python GUI application for controlling DJI Tello drones with camera feed and advanced flight patterns.

## 🚁 Features

### 🎮 Control Interface
- **Modern GUI** with tkinter-based interface
- **Real-time camera feed** with OpenCV
- **Joystick-style controls** for intuitive operation
- **Keyboard shortcuts** for quick commands
- **Touch-friendly buttons** for all operations

### ✈️ Flight Capabilities
- **Basic Movement**: Forward, backward, left, right, up, down
- **Rotation Control**: Clockwise and counter-clockwise rotation
- **Auto Patterns**: Circle flights (clockwise/counter-clockwise)
- **Flip Maneuvers**: Forward flips
- **Emergency Stop**: Immediate halt for safety

### 📊 Telemetry
- **Battery monitoring** with low-battery warnings
- **Real-time status** indicators
- **Connection status** with visual feedback
- **Flight mode** indicators

### 🎬 Camera Features
- **Live video stream** from drone camera
- **Recording capability** (planned)
- **Frame capture** for screenshots
- **Video overlay** with flight information

## 🛠️ Installation

### Prerequisites
- **Python 3.7+** (3.8+ recommended)
- **Windows 10/11**, **macOS**, or **Linux**
- **DJI Tello drone** with charged battery
- **WiFi connection** to drone

### Quick Setup

1. **Run the setup script:**
```bash
python setup_drone_controller.py
```

2. **Or install manually:**
```bash
pip install -r requirements.txt
```

### Manual Installation

```bash
# Core drone library
pip install djitellopy>=2.4.0

# Computer vision
pip install opencv-python>=4.8.0

# Image processing
pip install Pillow>=10.0.0
pip install numpy>=1.24.0
```

## 🎯 Usage

### Launching from React App
1. Open the Cureva React application
2. Navigate to Drone Camera view
3. Click the **"🐍 PYTHON GUI"** button
4. The Python controller will launch in a separate window

### Direct Launch
```bash
python drone_controller_gui.py
```

### Drone Connection
1. **Power on** your DJI Tello drone
2. **Connect** your computer to the Tello WiFi network
3. Click **"🟢 CONNECT"** in the GUI
4. Wait for battery status and camera feed

### Basic Controls

#### 🎮 GUI Controls
- **CONNECT/DISCONNECT**: Establish drone connection
- **TAKEOFF/LAND**: Launch and land the drone
- **Movement arrows**: Navigate drone position
- **Rotation buttons**: Turn drone left/right
- **UP/DOWN**: Adjust altitude
- **Speed slider**: Control movement speed

#### ⌨️ Keyboard Shortcuts
```
Movement:
  W/↑     - Forward
  S/↓     - Backward  
  A/←     - Left
  D/→     - Right
  R       - Up
  F       - Down

Rotation:
  Q       - Rotate left
  E       - Rotate right

Actions:
  Space   - Flip
  C       - Circle clockwise
  V       - Circle counter-clockwise
  ESC     - Emergency stop
```

### Advanced Features

#### 🔄 Auto Circle Flight
```python
# Programmatic circle flight
fly_one_full_circle(tello, speed=20, radius_cm=45, clockwise=True)
```

#### 📱 Integration with React
The Python GUI integrates seamlessly with the React application:
- Launched via service call
- Status updates to React interface
- Shared telemetry data
- Coordinated operation modes

## 🔧 Configuration

### Speed Settings
- **Range**: 10-100 cm/s
- **Default**: 50 cm/s
- **Recommended**: 20-30 cm/s for beginners

### Circle Flight Parameters
- **Radius**: 45-80 cm (adjustable)
- **Speed**: 20-30 cm/s for smooth circles
- **Duration**: Auto-calculated based on circumference

### Safety Features
- **Battery monitoring**: Automatic warnings below 15%
- **Connection validation**: Prevents commands when disconnected
- **Emergency stop**: Immediate hover on ESC key
- **Smooth acceleration**: Gradual speed changes for stability

## 🚨 Safety Guidelines

### Pre-flight Checklist
- [ ] Battery level > 15%
- [ ] Clear flight area (3m+ radius)
- [ ] No people or obstacles nearby
- [ ] WiFi connection stable
- [ ] Emergency stop procedure known

### During Flight
- **Stay alert** and ready to use emergency stop
- **Monitor battery** level continuously
- **Keep drone in visual sight** at all times
- **Avoid crowded areas** and private property
- **Follow local regulations** for drone operation

### Emergency Procedures
1. **ESC key** - Immediate emergency stop
2. **LAND button** - Controlled landing
3. **Power off drone** - Last resort (may crash)

## 🔍 Troubleshooting

### Connection Issues
```
❌ Problem: Cannot connect to drone
✅ Solution:
   1. Check drone is powered on
   2. Connect to Tello WiFi network
   3. Verify no other apps using drone
   4. Restart drone and reconnect
```

### Camera Feed Issues
```
❌ Problem: No video feed
✅ Solution:
   1. Restart video stream
   2. Check OpenCV installation
   3. Update drone firmware
   4. Reduce other network usage
```

### Performance Issues
```
❌ Problem: Laggy controls or video
✅ Solution:
   1. Close other applications
   2. Use 5GHz WiFi if available
   3. Reduce video quality
   4. Check system resources
```

## 🛠️ Development

### File Structure
```
src/python/
├── drone_controller_gui.py    # Main GUI application
├── basic_movement.py          # Original movement script
├── launch_drone_gui.py        # React integration launcher
├── setup_drone_controller.py  # Installation script
├── requirements.txt           # Python dependencies
└── README.md                  # This documentation
```

### Adding Features
1. **New movement patterns**: Extend `fly_one_full_circle()` function
2. **GUI improvements**: Modify tkinter interface in `setup_ui()`
3. **Telemetry features**: Add sensors in `update_video()` loop
4. **React integration**: Update `droneService.ts` for new capabilities

### Testing
```bash
# Test drone connection
python -c "from djitellopy import Tello; t=Tello(); t.connect(); print(f'Battery: {t.get_battery()}%')"

# Test camera
python -c "import cv2; print('OpenCV version:', cv2.__version__)"

# Run full setup verification
python setup_drone_controller.py
```

## 📚 API Reference

### DroneControllerGUI Class

#### Methods
- `connect_drone()` - Establish drone connection
- `disconnect_drone()` - Close drone connection
- `takeoff()` - Launch drone
- `land()` - Land drone
- `move_drone(direction)` - Move in specified direction
- `auto_circle(clockwise)` - Perform circle flight
- `emergency_stop()` - Immediate stop

#### Events
- `on_key_press(event)` - Handle keyboard input
- `update_video()` - Refresh camera feed
- `on_closing()` - Cleanup on app exit

## 🤝 Integration with React

The Python controller integrates with the React application through:

1. **Service Layer**: `droneService.ts` handles communication
2. **Launcher Script**: `launch_drone_gui.py` starts GUI process
3. **Status Updates**: Real-time feedback to React interface
4. **Shared Controls**: Coordinated operation between interfaces

## 📄 License

This project is part of the Cureva application. See main project license for details.

## 🆘 Support

For issues and support:
1. Check troubleshooting section above
2. Verify all dependencies are installed
3. Test drone connection independently
4. Check DJI Tello documentation for firmware updates

---
**⚠️ Important**: Always follow local drone regulations and safety guidelines when operating DJI Tello drones.