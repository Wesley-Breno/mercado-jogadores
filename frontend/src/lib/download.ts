/** Hands a file received from the API to the browser, as a download with the given name. */
export function saveFile(file: Blob, filename: string): void {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
