
const KEY = 'entries'

export type Entry = {
    id: string
    time: number
    calories: number
    protein: number
    note?: string
}

export function saveEntries(entries: Entry[]) {
    localStorage.setItem(KEY, JSON.stringify(entries))
}

export function loadEntries(): Entry[]{
    try{
        return JSON.parse(localStorage.getItem(KEY) ?? '[]')
    }catch{
        return []
    }
}