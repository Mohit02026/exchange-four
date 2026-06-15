import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'
import path from 'path'

function getStorageClient(): S3Client | null {
  const endpoint = process.env.MINIO_ENDPOINT
  const accessKeyId = process.env.MINIO_ACCESS_KEY
  const secretAccessKey = process.env.MINIO_SECRET_KEY
  if (!endpoint || !accessKeyId || !secretAccessKey) return null

  return new S3Client({
    endpoint,
    region: 'us-east-1',
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })
}

const BUCKET = process.env.MINIO_BUCKET ?? 'exchange-four'

// Create a logical "folder" prefix in the MinIO bucket for an applicant.
// Returns { folderId: <prefix key>, folderUrl: <base URL> } or null if not configured.
export async function createApplicantFolder(
  folderName: string
): Promise<{ folderId: string; folderUrl: string } | null> {
  const client = getStorageClient()
  if (!client) return null

  const prefix = `applicants/${folderName}/`
  const endpoint = process.env.MINIO_ENDPOINT!
  return {
    folderId: prefix,
    folderUrl: `${endpoint}/${BUCKET}/${encodeURIComponent(folderName)}/`,
  }
}

// Create a logical employee folder structure in MinIO.
// Returns { folderId, folderUrl } or null if MinIO is not configured.
export async function createEmployeeFolder(
  lastName: string,
  firstName: string
): Promise<{ folderId: string; folderUrl: string } | null> {
  const client = getStorageClient()
  if (!client) return null

  const slug = `${lastName}-${firstName}`
  const prefix = `employees/${slug}/`
  const endpoint = process.env.MINIO_ENDPOINT!
  return {
    folderId: prefix,
    folderUrl: `${endpoint}/${BUCKET}/${encodeURIComponent(slug)}/`,
  }
}

// Upload a local file (relative to public/) to MinIO under folderKey.
// Returns the MinIO public URL or null on failure.
export async function uploadFileToDrive(
  localUrl: string,
  fileName: string,
  mimeType: string,
  folderKey: string
): Promise<string | null> {
  const client = getStorageClient()
  if (!client) return null

  const fullPath = path.join(process.cwd(), 'public', localUrl)
  if (!fs.existsSync(fullPath)) return null

  const objectKey = `${folderKey}${fileName}`
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
      Body: fs.readFileSync(fullPath),
      ContentType: mimeType,
    })
  )

  const endpoint = process.env.MINIO_ENDPOINT!
  return `${endpoint}/${BUCKET}/${objectKey}`
}

// Remove the local upload directory once files are in MinIO.
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
