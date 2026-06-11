interface AppFile {
  id: string
  type: string
  fileName: string
  fileUrl: string
  uploadedAt: string
}

interface FilesTabProps {
  files: AppFile[]
  driveFolder: { storageUrl?: string; folderUrl?: string } | null
}

const FILE_TYPE_COLORS: Record<string, string> = {
  CV: 'bg-blue-100 text-blue-800',
  PHOTO: 'bg-purple-100 text-purple-800',
  DOCUMENT: 'bg-gray-100 text-gray-700',
}

export default function FilesTab({ files, driveFolder }: FilesTabProps) {
  return (
    <div className="space-y-4">
      {driveFolder && (driveFolder.storageUrl ?? driveFolder.folderUrl) && (
        <a
          href={(driveFolder.storageUrl ?? driveFolder.folderUrl)!}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          📁 Open Files ↗
        </a>
      )}

      {files.length === 0 ? (
        <p className="text-sm text-gray-500">No files uploaded.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {files.map(f => (
            <li key={f.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FILE_TYPE_COLORS[f.type] ?? 'bg-gray-100 text-gray-700'}`}>
                  {f.type}
                </span>
                <span className="text-sm text-gray-800">{f.fileName}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400">
                  {new Date(f.uploadedAt).toLocaleDateString()}
                </span>
                <a
                  href={f.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
