import { db } from '@/db/db';

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILE_NAME = 'NextTracker_Backup.json';

declare global {
    interface Window {
        google: any;
    }
}

let tokenClient: any;

export const googleDriveService = {
    /**
     * Initialize the OAuth2 token client
     */
    async initTokenClient(clientId: string) {
        if (!window.google) {
            console.error('Google GSI script not loaded');
            return;
        }

        tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: async (response: any) => {
                if (response.error !== undefined) {
                    throw response;
                }

                // Save access token
                const settings = await db.settings.get(1);
                await db.settings.put({
                    ...settings,
                    id: 1,
                    googleAccessToken: response.access_token,
                    googleTokenExpiry: Date.now() + (response.expires_in * 1000)
                });
            },
        });
    },

    /**
     * Request a new token
     */
    async connect(clientId: string): Promise<string> {
        if (!tokenClient) await this.initTokenClient(clientId);

        return new Promise((resolve, reject) => {
            try {
                tokenClient.callback = (response: any) => {
                    if (response.error) reject(response);
                    else resolve(response.access_token);
                };
                tokenClient.requestAccessToken({ prompt: 'consent' });
            } catch (err) {
                reject(err);
            }
        });
    },

    /**
     * Check if the current token is still valid
     */
    async getValidToken(): Promise<string | null> {
        const settings = await db.settings.get(1);
        if (!settings?.googleAccessToken || !settings?.googleTokenExpiry) return null;

        // If expired or about to expire in 5 minutes
        if (Date.now() > settings.googleTokenExpiry - (5 * 60 * 1000)) {
            return null;
        }

        return settings.googleAccessToken;
    },

    /**
     * Find existing backup file on Drive
     */
    async findBackupFile(token: string): Promise<string | null> {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILE_NAME}' and trashed=false`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();
        if (data.files && data.files.length > 0) {
            return data.files[0].id;
        }
        return null;
    },

    /**
     * Upload backup to Drive
     */
    async uploadBackup(token: string) {
        // 1. Get current data
        const items = await db.items.toArray();
        const books = await db.books.toArray();
        const settings = await db.settings.get(1);

        const backupData = {
            items,
            books,
            settings: {
                ...settings,
                googleAccessToken: undefined, // Don't backup tokens
                googleTokenExpiry: undefined
            },
            version: 1,
            exportDate: new Date().toISOString()
        };

        const fileContent = JSON.stringify(backupData, null, 2);
        const fileId = await this.findBackupFile(token);

        if (fileId) {
            // Update existing file
            await fetch(
                `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: fileContent,
                }
            );
        } else {
            // Create new file
            const metadata = {
                name: BACKUP_FILE_NAME,
                mimeType: 'application/json',
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([fileContent], { type: 'application/json' }));

            await fetch(
                'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: form,
                }
            );
        }

        // Update last backup time
        await db.settings.update(1, { lastAutoBackup: Date.now() });
    }
};
