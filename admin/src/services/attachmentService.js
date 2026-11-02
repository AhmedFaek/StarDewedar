import { getValidAccessToken, refreshAccessToken } from './tokenService'
import { API_BASE_URL } from '../utils/constants'

const getAttachmentDownloadUrl = (downloadPath) => {
    if (typeof downloadPath !== 'string' || !downloadPath.startsWith('/')) {
        throw new Error('Attachment download path is invalid')
    }

    const apiUrl = new URL(API_BASE_URL, window.location.origin)
    const downloadUrl = new URL(downloadPath, apiUrl)
    const apiPath = apiUrl.pathname.replace(/\/+$/, '')

    if (
        downloadUrl.origin !== apiUrl.origin ||
        !downloadUrl.pathname.startsWith(`${apiPath}/attachments/`) ||
        !downloadUrl.pathname.endsWith('/download')
    ) {
        throw new Error('Attachment download path is invalid')
    }

    return downloadUrl
}

const saveBlob = (blob, filename) => {
    const safeFilename = String(filename || 'attachment')
        .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
        .trim() || 'attachment'
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = blobUrl
    link.download = safeFilename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
}

const readErrorMessage = async (response) => {
    try {
        const body = await response.json()
        return body.message || `HTTP ${response.status}`
    } catch {
        return `HTTP ${response.status}`
    }
}

export const downloadRequestAttachment = async (attachment) => {
    const url = getAttachmentDownloadUrl(attachment?.download_path)
    const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin
    let token = await getValidAccessToken()
    let response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    })

    if (response.status === 401 && new URL(response.url).origin === apiOrigin) {
        token = await refreshAccessToken()
        response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        })
    }

    if (!response.ok) {
        throw new Error(await readErrorMessage(response))
    }

    saveBlob(await response.blob(), attachment.original_filename)
}
