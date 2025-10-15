from flask import Flask, request, jsonify, send_file, render_template
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import uuid
import threading
from datetime import datetime
from werkzeug.utils import secure_filename
import json
import time
from google.oauth2.credentials import Credentials
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'
app.config['GDRIVE_FOLDER'] = 'gdrive_downloads'
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max

# Google Drive config
app.config['GDRIVE_CREDENTIALS_FILE'] = 'credentials.json'
app.config['GDRIVE_WATCH_FOLDER_ID'] = None  # Will be set from config
app.config['GDRIVE_POLL_INTERVAL'] = 30  # Check every 30 seconds

CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Ensure folders exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)
os.makedirs(app.config['GDRIVE_FOLDER'], exist_ok=True)

# Store processing jobs
processing_jobs = {}
ALLOWED_EXTENSIONS = {'zip', 'rar', 'tar', 'gz', '7z', 'jpg', 'png', 'jpeg'}

# Google Drive service
gdrive_service = None
gdrive_watcher_thread = None
last_checked_files = set()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_dataset_to_ply(job_id, input_path, output_path):
    """
    Process dataset images to PLY format
    This is a placeholder - you'll need to implement actual 3D reconstruction
    """
    try:
        # Update job status
        processing_jobs[job_id]['status'] = 'processing'
        processing_jobs[job_id]['progress'] = 10
        socketio.emit('job_update', processing_jobs[job_id], room=job_id)

        # Simulate processing stages
        import time

        # Stage 1: Extract files
        processing_jobs[job_id]['progress'] = 20
        processing_jobs[job_id]['stage'] = 'Extracting files'
        socketio.emit('job_update', processing_jobs[job_id], room=job_id)
        time.sleep(2)

        # Stage 2: Feature detection
        processing_jobs[job_id]['progress'] = 40
        processing_jobs[job_id]['stage'] = 'Detecting features'
        socketio.emit('job_update', processing_jobs[job_id], room=job_id)
        time.sleep(2)

        # Stage 3: Point cloud generation
        processing_jobs[job_id]['progress'] = 60
        processing_jobs[job_id]['stage'] = 'Generating point cloud'
        socketio.emit('job_update', processing_jobs[job_id], room=job_id)
        time.sleep(2)

        # Stage 4: Creating PLY
        processing_jobs[job_id]['progress'] = 80
        processing_jobs[job_id]['stage'] = 'Creating PLY file'
        socketio.emit('job_update', processing_jobs[job_id], room=job_id)

        # TODO: Implement actual PLY generation
        # For now, create a dummy PLY file
        create_sample_ply(output_path)

        # Complete
        processing_jobs[job_id]['status'] = 'completed'
        processing_jobs[job_id]['progress'] = 100
        processing_jobs[job_id]['stage'] = 'Complete'
        processing_jobs[job_id]['output_file'] = os.path.basename(output_path)
        processing_jobs[job_id]['completed_at'] = datetime.now().isoformat()

        socketio.emit('job_update', processing_jobs[job_id], room=job_id)
        socketio.emit('job_complete', {
            'job_id': job_id,
            'output_file': os.path.basename(output_path),
            'download_url': f'/download/{job_id}'
        }, room=job_id)

    except Exception as e:
        processing_jobs[job_id]['status'] = 'failed'
        processing_jobs[job_id]['error'] = str(e)
        socketio.emit('job_error', {'job_id': job_id, 'error': str(e)}, room=job_id)

def create_sample_ply(output_path):
    """Create a sample PLY file for testing"""
    ply_content = """ply
format ascii 1.0
element vertex 100
property float x
property float y
property float z
property uchar red
property uchar green
property uchar blue
end_header
"""
    # Add some sample points
    import random
    for i in range(100):
        x = random.uniform(-1, 1)
        y = random.uniform(-1, 1)
        z = random.uniform(-1, 1)
        r = random.randint(0, 255)
        g = random.randint(0, 255)
        b = random.randint(0, 255)
        ply_content += f"{x} {y} {z} {r} {g} {b}\n"

    with open(output_path, 'w') as f:
        f.write(ply_content)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload dataset file for processing"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if file and allowed_file(file.filename):
        # Create unique job ID
        job_id = str(uuid.uuid4())

        # Save uploaded file
        filename = secure_filename(file.filename)
        input_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{job_id}_{filename}")
        file.save(input_path)

        # Create output path
        output_filename = f"{job_id}_output.ply"
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)

        # Create job entry
        processing_jobs[job_id] = {
            'job_id': job_id,
            'filename': filename,
            'status': 'queued',
            'progress': 0,
            'stage': 'Queued',
            'created_at': datetime.now().isoformat(),
            'input_size': os.path.getsize(input_path)
        }

        # Start processing in background thread
        thread = threading.Thread(
            target=process_dataset_to_ply,
            args=(job_id, input_path, output_path)
        )
        thread.start()

        return jsonify({
            'job_id': job_id,
            'status': 'queued',
            'message': 'File uploaded successfully, processing started'
        }), 200

    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/api/status/<job_id>', methods=['GET'])
def get_status(job_id):
    """Get processing status"""
    if job_id in processing_jobs:
        return jsonify(processing_jobs[job_id]), 200
    return jsonify({'error': 'Job not found'}), 404

@app.route('/api/jobs', methods=['GET'])
def get_all_jobs():
    """Get all processing jobs"""
    return jsonify(list(processing_jobs.values())), 200

@app.route('/download/<job_id>', methods=['GET'])
def download_file(job_id):
    """Download processed PLY file"""
    if job_id not in processing_jobs:
        return jsonify({'error': 'Job not found'}), 404

    job = processing_jobs[job_id]
    if job['status'] != 'completed':
        return jsonify({'error': 'Job not completed yet'}), 400

    output_file = job.get('output_file')
    if not output_file:
        return jsonify({'error': 'Output file not found'}), 404

    file_path = os.path.join(app.config['OUTPUT_FOLDER'], output_file)
    if not os.path.exists(file_path):
        return jsonify({'error': 'File does not exist'}), 404

    return send_file(file_path, as_attachment=True, download_name=output_file)

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connected', {'message': 'Connected to server'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('subscribe')
def handle_subscribe(data):
    """Subscribe to job updates"""
    job_id = data.get('job_id')
    if job_id:
        socketio.server.enter_room(request.sid, job_id)
        emit('subscribed', {'job_id': job_id})

# Google Drive Integration Functions
def init_gdrive_service():
    """Initialize Google Drive service"""
    global gdrive_service
    try:
        creds_file = app.config['GDRIVE_CREDENTIALS_FILE']
        if not os.path.exists(creds_file):
            print(f"Warning: Google Drive credentials file not found: {creds_file}")
            return None

        # Use service account credentials
        creds = service_account.Credentials.from_service_account_file(
            creds_file,
            scopes=['https://www.googleapis.com/auth/drive.readonly']
        )

        gdrive_service = build('drive', 'v3', credentials=creds)
        print("Google Drive service initialized successfully")
        return gdrive_service
    except Exception as e:
        print(f"Failed to initialize Google Drive service: {e}")
        return None

def download_file_from_gdrive(file_id, filename, destination_folder):
    """Download file from Google Drive"""
    try:
        if not gdrive_service:
            print("Google Drive service not initialized")
            return None

        request = gdrive_service.files().get_media(fileId=file_id)
        file_path = os.path.join(destination_folder, filename)

        fh = io.FileIO(file_path, 'wb')
        downloader = MediaIoBaseDownload(fh, request)

        done = False
        while not done:
            status, done = downloader.next_chunk()
            if status:
                print(f"Download progress: {int(status.progress() * 100)}%")

        fh.close()
        print(f"File downloaded successfully: {file_path}")
        return file_path
    except Exception as e:
        print(f"Error downloading file from Google Drive: {e}")
        return None

def watch_gdrive_folder():
    """Watch Google Drive folder for new files"""
    global last_checked_files

    if not gdrive_service:
        print("Google Drive service not available, skipping watch")
        return

    folder_id = app.config['GDRIVE_WATCH_FOLDER_ID']
    if not folder_id:
        print("No Google Drive folder ID configured")
        return

    try:
        # Query files in the folder
        query = f"'{folder_id}' in parents and trashed=false"
        results = gdrive_service.files().list(
            q=query,
            fields="files(id, name, mimeType, createdTime, size)",
            orderBy="createdTime desc"
        ).execute()

        files = results.get('files', [])

        for file in files:
            file_id = file['id']
            file_name = file['name']

            # Check if this is a new file
            if file_id not in last_checked_files:
                print(f"\n🔔 New file detected in Google Drive: {file_name}")

                # Check if file type is allowed
                if allowed_file(file_name):
                    # Download the file
                    print(f"Downloading file: {file_name}")
                    socketio.emit('gdrive_notification', {
                        'type': 'new_file',
                        'filename': file_name,
                        'status': 'downloading'
                    })

                    downloaded_path = download_file_from_gdrive(
                        file_id,
                        file_name,
                        app.config['GDRIVE_FOLDER']
                    )

                    if downloaded_path:
                        # Create processing job
                        job_id = str(uuid.uuid4())
                        output_filename = f"{job_id}_output.ply"
                        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)

                        processing_jobs[job_id] = {
                            'job_id': job_id,
                            'filename': file_name,
                            'status': 'queued',
                            'progress': 0,
                            'stage': 'Queued',
                            'source': 'google_drive',
                            'created_at': datetime.now().isoformat(),
                            'input_size': os.path.getsize(downloaded_path)
                        }

                        socketio.emit('gdrive_notification', {
                            'type': 'download_complete',
                            'filename': file_name,
                            'job_id': job_id,
                            'status': 'processing_started'
                        })

                        # Start processing
                        thread = threading.Thread(
                            target=process_dataset_to_ply,
                            args=(job_id, downloaded_path, output_path)
                        )
                        thread.start()

                        print(f"✅ Processing started for Google Drive file: {file_name} (Job ID: {job_id})")
                    else:
                        socketio.emit('gdrive_notification', {
                            'type': 'error',
                            'filename': file_name,
                            'error': 'Failed to download file'
                        })
                else:
                    print(f"⚠️ File type not allowed: {file_name}")

                last_checked_files.add(file_id)

    except Exception as e:
        print(f"Error watching Google Drive folder: {e}")

def gdrive_watcher_loop():
    """Background thread to continuously watch Google Drive"""
    print("🔍 Google Drive watcher started")
    while True:
        try:
            watch_gdrive_folder()
            time.sleep(app.config['GDRIVE_POLL_INTERVAL'])
        except Exception as e:
            print(f"Error in Google Drive watcher loop: {e}")
            time.sleep(60)  # Wait longer if error occurs

def start_gdrive_watcher():
    """Start Google Drive watcher thread"""
    global gdrive_watcher_thread

    if init_gdrive_service():
        gdrive_watcher_thread = threading.Thread(target=gdrive_watcher_loop, daemon=True)
        gdrive_watcher_thread.start()
        print("✅ Google Drive watcher thread started")
    else:
        print("⚠️ Google Drive watcher not started (service initialization failed)")

# API Endpoints for Google Drive
@app.route('/api/gdrive/config', methods=['POST'])
def set_gdrive_config():
    """Set Google Drive folder ID to watch"""
    data = request.json
    folder_id = data.get('folder_id')

    if not folder_id:
        return jsonify({'error': 'folder_id required'}), 400

    app.config['GDRIVE_WATCH_FOLDER_ID'] = folder_id

    return jsonify({
        'message': 'Google Drive folder configured',
        'folder_id': folder_id
    }), 200

@app.route('/api/gdrive/status', methods=['GET'])
def get_gdrive_status():
    """Get Google Drive integration status"""
    return jsonify({
        'enabled': gdrive_service is not None,
        'watching': gdrive_watcher_thread is not None and gdrive_watcher_thread.is_alive(),
        'folder_id': app.config['GDRIVE_WATCH_FOLDER_ID'],
        'poll_interval': app.config['GDRIVE_POLL_INTERVAL'],
        'files_tracked': len(last_checked_files)
    }), 200

@app.route('/api/gdrive/trigger-check', methods=['POST'])
def trigger_gdrive_check():
    """Manually trigger Google Drive check"""
    if not gdrive_service:
        return jsonify({'error': 'Google Drive service not initialized'}), 400

    watch_gdrive_folder()
    return jsonify({'message': 'Google Drive check triggered'}), 200

if __name__ == '__main__':
    # Start Google Drive watcher
    start_gdrive_watcher()

    # Start Flask-SocketIO server
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
