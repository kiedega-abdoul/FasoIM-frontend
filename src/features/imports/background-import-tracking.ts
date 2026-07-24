const STORAGE_KEY = "fasoim.imports.background"

export function readTrackedIds(): number[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    if (!Array.isArray(value)) return []

    return [...new Set(
      value
        .map((item: unknown) => Number(item))
        .filter((item: number) => Number.isFinite(item)),
    )]
  } catch {
    return []
  }
}

export function writeTrackedIds(ids: number[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]))
  window.dispatchEvent(new Event("fasoim:background-imports-changed"))
}

export function trackBackgroundImport(id: number): void {
  writeTrackedIds([...readTrackedIds(), id])
}

export function untrackBackgroundImport(id: number): void {
  writeTrackedIds(readTrackedIds().filter((trackedId) => trackedId !== id))
}

export function isBackgroundImportTracked(id: number): boolean {
  return readTrackedIds().includes(id)
}
