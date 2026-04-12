import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_DIR = path.join(process.cwd(), 'data', 'storage')

export function getStoragePath(bucket: string, filename: string): string {
  const dir = path.join(STORAGE_DIR, bucket, path.dirname(filename))
  fs.mkdirSync(dir, { recursive: true })
  return path.join(STORAGE_DIR, bucket, filename)
}

export function getPublicUrl(bucket: string, filename: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${appUrl}/api/storage/${bucket}/${filename}`
}

export async function saveFile(bucket: string, filename: string, data: Buffer | ArrayBuffer): Promise<string> {
  const filePath = getStoragePath(bucket, filename)
  const buf = data instanceof ArrayBuffer ? Buffer.from(new Uint8Array(data)) : data
  fs.writeFileSync(filePath, buf)
  return getPublicUrl(bucket, filename)
}

export function readFile(bucket: string, filename: string): Buffer | null {
  const filePath = getStoragePath(bucket, filename)
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath)
}

export function deleteFile(bucket: string, filename: string): void {
  const filePath = getStoragePath(bucket, filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}
