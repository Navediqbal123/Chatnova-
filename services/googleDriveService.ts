// @ts-nocheck

// --- services/googleDriveService.ts ---

// IMPORTANT: Replace with your actual Google Cloud project credentials.
// You can get these from the Google Cloud Console: https://console.cloud.google.com/
const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com'; // Replace with your OAuth 2.0 Client ID
const API_KEY = 'YOUR_GOOGLE_API_KEY'; // Replace with your API Key

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let tokenClient = null;
let gapiInited = false;
let gsiInited = false;

/**
 * Loads the GAPI and GSI scripts and initializes the token client.
 * Must be called before any other functions.
 */
export function loadGoogleApis(onApisLoaded) {
    // Load GAPI client
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
        gapi.load('client:picker', async () => {
            await gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: [DISCOVERY_DOC],
            });
            gapiInited = true;
            if (gsiInited) onApisLoaded();
        });
    };
    document.body.appendChild(gapiScript);

    // Load GSI client
    const gsiScript = document.createElement('script');
    gsiScript.src = 'https://accounts.google.com/gsi/client';
    gsiScript.async = true;
    gsiScript.defer = true;
    gsiScript.onload = () => {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // The callback is handled by the promise in handleAuthClick
        });
        gsiInited = true;
        if (gapiInited) onApisLoaded();
    };
    document.body.appendChild(gsiScript);
}

/**
 * Prompts the user to sign in and authorize the app.
 */
function handleAuthClick() {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            return reject(new Error('Google Auth client not initialized.'));
        }

        const callback = (resp) => {
            if (resp.error) {
                return reject(resp.error);
            }
            gapi.client.setToken(resp);
            resolve(resp);
        };

        if (gapi.client.getToken() === null) {
            tokenClient.callback = callback;
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.callback = callback;
            tokenClient.requestAccessToken({ prompt: '' });
        }
    });
}

/**
 * Creates and displays the Google Picker UI for file selection.
 */
function createPicker(accessToken) {
    return new Promise((resolve, reject) => {
        const view = new google.picker.View(google.picker.ViewId.DOCS);
        // Only allow text-based documents
        view.setMimeTypes("text/plain,application/pdf,application/vnd.google-apps.document,text/markdown,text/javascript,application/json,application/x-javascript,text/html,text/css,application/typescript,application/x-typescript");

        const picker = new google.picker.PickerBuilder()
            .setAppId(CLIENT_ID.split('-')[0]) // Use the numeric part of the client ID as App ID
            .setOAuthToken(accessToken)
            .addView(view)
            .setDeveloperKey(API_KEY)
            .setCallback((data) => {
                if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
                    const doc = data[google.picker.Response.DOCUMENTS][0];
                    resolve({ id: doc.id, name: doc.name, mimeType: doc.mimeType });
                } else if (data[google.picker.Response.ACTION] === google.picker.Action.CANCEL) {
                    reject(new Error('Picker cancelled by user.'));
                }
            })
            .build();
        picker.setVisible(true);
    });
}


/**
 * Fetches the content of a file from Google Drive.
 */
async function getFileContent(fileId, mimeType) {
    try {
        // For Google Docs, we need to export them as plain text
        if (mimeType === 'application/vnd.google-apps.document') {
             const response = await gapi.client.drive.files.export({
                fileId: fileId,
                mimeType: 'text/plain',
            });
            return response.body;
        } else {
            // For other file types, we can get the media content directly
            const response = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media',
            });
            return response.body;
        }
    } catch (err) {
        console.error("Error fetching file content:", err);
        throw new Error(`Could not read the file. Please ensure it's a text-based document and that you have permission to access it.`);
    }
}

/**
 * Main function to handle the entire file picking and fetching process.
 */
export async function pickFileFromDrive() {
    if (CLIENT_ID.startsWith('YOUR_') || API_KEY.startsWith('YOUR_')) {
        throw new Error('Google Drive integration is not configured. Please add your Client ID and API Key in services/googleDriveService.ts');
    }
    
    try {
        await handleAuthClick();
        const token = gapi.client.getToken();
        if (!token) throw new Error('Authentication failed.');

        const file = await createPicker(token.access_token);
        const content = await getFileContent(file.id, file.mimeType);

        return { name: file.name, content };
    } catch (error) {
        console.error('Google Drive Picker Error:', error);
        // Don't throw an error for user cancellation
        if (error instanceof Error && error.message.includes('Picker cancelled')) {
             return Promise.reject(null); // Special case to indicate cancellation without error
        }
        throw new Error('Failed to retrieve file from Google Drive.');
    }
}
