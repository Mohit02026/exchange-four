import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'

// Initialise Drive client from service account env vars.
// Returns null if credentials are not configured — Drive upload is skipped gracefully.
function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!email || !key) return null

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  return google.drive({ version: 'v3', auth })
}

// Create a subfolder inside the root applicant folder.
// Returns { folderId, folderUrl } or null if Drive is not configured.
export async function createApplicantFolder(
  folderName: string
): Promise<{ folderId: string; folderUrl: string } | null> {
  const drive = getDriveClient()
  if (!drive) return null

  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
  if (!rootFolderId) return null

  const res = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId],
    },
    fields: 'id, webViewLink',
  })

  const folderId = res.data.id!
  const folderUrl = res.data.webViewLink!
  return { folderId, folderUrl }
}

// Upload a local file to a Drive folder.
// Returns the Drive file ID or null on failure.
export async function uploadFileToDrive(
  localPath: string,
  fileName: string,
  mimeType: string,
  folderId: string
): Promise<string | null> {
  const drive = getDriveClient()
  if (!drive) return null

  const fullPath = path.join(process.cwd(), 'public', localPath)
  if (!fs.existsSync(fullPath)) return null

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: fs.createReadStream(fullPath),
    },
    fields: 'id',
  })

  return res.data.id ?? null
}

// Delete the local upload folder for a reference once files are on Drive.
export function deleteLocalUploads(reference: string) {
  const dir = path.join(process.cwd(), 'public', 'uploads', reference)
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
}

// MIME type lookup for uploaded files.
export function mimeTypeForFile(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  const map: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
  }
  return map[ext] ?? 'application/octet-stream'
}
