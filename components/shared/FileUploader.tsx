'use client'

interface Props {
  label: string
  name: string
  accept: string
  hint?: string
  required?: boolean
}

export default function FileUploader({ label, name, accept, hint, required }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="file"
        name={name}
        accept={accept}
        required={required}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-medium
          file:bg-gray-100 file:text-gray-700
          hover:file:bg-gray-200 cursor-pointer"
      />
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}
