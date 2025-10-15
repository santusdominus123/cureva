#!/usr/bin/env python3
"""
Google Drive Integration Module for DJI Tello Python GUI
Enables automatic photo upload from drone to Google Drive
"""

import os
import io
import time
from pathlib import Path
from typing import Optional
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import pickle

# Google Drive API scopes
SCOPES = ['https://www.googleapis.com/auth/drive.file']

class DroneGDriveUploader:
    """Handles Google Drive authentication and photo uploads for drone"""

    def __init__(self, credentials_file: str = 'credentials.json', token_file: str = 'token.pickle'):
        """
        Initialize Google Drive uploader

        Args:
            credentials_file: Path to OAuth client credentials JSON
            token_file: Path to store access token
        """
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.service = None
        self.folder_id = None
        self.folder_name = "tello_captures"

    def authenticate(self) -> bool:
        """
        Authenticate with Google Drive API

        Returns:
            bool: True if authentication successful
        """
        creds = None

        # Load existing token if available
        if os.path.exists(self.token_file):
            with open(self.token_file, 'rb') as token:
                creds = pickle.load(token)

        # If no valid credentials, authenticate
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(self.credentials_file):
                    print(f"Error: {self.credentials_file} not found!")
                    print("Please download OAuth credentials from Google Cloud Console")
                    return False

                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, SCOPES)
                creds = flow.run_local_server(port=0)

            # Save credentials for future use
            with open(self.token_file, 'wb') as token:
                pickle.dump(creds, token)

        # Build service
        self.service = build('drive', 'v3', credentials=creds)
        print("✅ Successfully authenticated with Google Drive")
        return True

    def ensure_folder(self, folder_name: str = None) -> Optional[str]:
        """
        Ensure upload folder exists in Google Drive

        Args:
            folder_name: Name of folder to create/find

        Returns:
            str: Folder ID if successful, None otherwise
        """
        if folder_name:
            self.folder_name = folder_name

        if not self.service:
            print("Error: Not authenticated. Call authenticate() first")
            return None

        try:
            # Search for existing folder
            query = f"name='{self.folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
            results = self.service.files().list(
                q=query,
                spaces='drive',
                fields='files(id, name)'
            ).execute()

            files = results.get('files', [])

            if files:
                self.folder_id = files[0]['id']
                print(f"📁 Found existing folder: {self.folder_name}")
            else:
                # Create new folder
                file_metadata = {
                    'name': self.folder_name,
                    'mimeType': 'application/vnd.google-apps.folder'
                }
                folder = self.service.files().create(
                    body=file_metadata,
                    fields='id'
                ).execute()
                self.folder_id = folder.get('id')
                print(f"📁 Created new folder: {self.folder_name}")

            return self.folder_id

        except Exception as e:
            print(f"Error ensuring folder: {e}")
            return None

    def upload_photo(self, photo_data: bytes, filename: str = None) -> Optional[str]:
        """
        Upload photo to Google Drive

        Args:
            photo_data: Photo bytes data
            filename: Name for the uploaded file

        Returns:
            str: File ID if successful, None otherwise
        """
        if not self.service:
            print("Error: Not authenticated. Call authenticate() first")
            return None

        if not self.folder_id:
            print("Error: Folder not set. Call ensure_folder() first")
            return None

        # Generate filename if not provided
        if not filename:
            timestamp = int(time.time() * 1000)
            filename = f"tello_{timestamp}.jpg"

        try:
            # Prepare file metadata
            file_metadata = {
                'name': filename,
                'parents': [self.folder_id]
            }

            # Create media upload
            media = MediaIoBaseUpload(
                io.BytesIO(photo_data),
                mimetype='image/jpeg',
                resumable=True
            )

            # Upload file
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, webViewLink'
            ).execute()

            file_id = file.get('id')
            web_link = file.get('webViewLink')

            print(f"✅ Uploaded: {filename}")
            print(f"🔗 Link: {web_link}")

            return file_id

        except Exception as e:
            print(f"❌ Upload failed: {e}")
            return None

    def upload_from_file(self, filepath: str) -> Optional[str]:
        """
        Upload photo from file path

        Args:
            filepath: Path to photo file

        Returns:
            str: File ID if successful, None otherwise
        """
        try:
            with open(filepath, 'rb') as f:
                photo_data = f.read()

            filename = Path(filepath).name
            return self.upload_photo(photo_data, filename)

        except Exception as e:
            print(f"Error reading file: {e}")
            return None

    def is_authenticated(self) -> bool:
        """Check if authenticated"""
        return self.service is not None

    def get_folder_link(self) -> Optional[str]:
        """Get shareable link to upload folder"""
        if not self.service or not self.folder_id:
            return None

        try:
            file = self.service.files().get(
                fileId=self.folder_id,
                fields='webViewLink'
            ).execute()
            return file.get('webViewLink')
        except Exception as e:
            print(f"Error getting folder link: {e}")
            return None


# Example usage
if __name__ == "__main__":
    print("DJI Tello Google Drive Integration Test")
    print("=" * 50)

    # Initialize uploader
    uploader = DroneGDriveUploader()

    # Authenticate
    print("\n1. Authenticating with Google Drive...")
    if not uploader.authenticate():
        print("Authentication failed!")
        exit(1)

    # Ensure folder exists
    print("\n2. Ensuring upload folder exists...")
    folder_id = uploader.ensure_folder("tello_test_captures")
    if not folder_id:
        print("Failed to create/find folder!")
        exit(1)

    print(f"✅ Folder ready: {uploader.folder_name}")
    print(f"🔗 Folder link: {uploader.get_folder_link()}")

    # Test upload with dummy data
    print("\n3. Testing upload...")
    test_data = b"Test photo data"
    file_id = uploader.upload_photo(test_data, f"test_{int(time.time())}.jpg")

    if file_id:
        print("✅ Test upload successful!")
    else:
        print("❌ Test upload failed!")

    print("\n" + "=" * 50)
    print("Integration test complete!")
