import './style.css'
import {loadEntries, type Entry, saveEntries} from "./storage.ts";

let entries = loadEntries()

let entriesToday: Entry[];

//outputs
const kcal_today = document.querySelector<HTMLSpanElement>('#today_kcal')!;
const protein_today = document.querySelector<HTMLSpanElement>('#today_protein')!;

//inputs
const input_note = document.querySelector<HTMLInputElement>('#note')!;
const input_calories = document.querySelector<HTMLInputElement>('#calories')!;
const input_protein = document.querySelector<HTMLInputElement>('#protein')!;
const addButton = document.querySelector<HTMLButtonElement>('#add_button')!
const entriesList = document.querySelector<HTMLUListElement>('#entry_list')!
const navBar = document.querySelector<HTMLElement>('#nav_bar')!
const settings_btns =  document.querySelector<HTMLElement>('#settings_btns')!
const daySelector = document.getElementById('calories_day_selector') as HTMLButtonElement | null;
const changeDay = document.getElementById('changeCurrentDay') as HTMLOutputElement | null;
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });


let dateOffset: number = 0;

//removes the shake effect, so it can shake again
input_note.addEventListener('animationend', () => {
    input_note.classList.remove('shake')
})


changeDay?.addEventListener('click',(event) => {
    const button = (event.target as HTMLElement).closest('button')
    if (!button) {
        return
    }

    if(button.id == "calories_step_back"){
        dateOffset -= 1;
    }else if (button.id == "calories_step_forward"){
        dateOffset += 1;
    }else if(button.id == "calories_day_selector"){
        dateOffset = 0;
    }
    render()
})

//delete button of single entries
entriesList.addEventListener('click',(event) => {
    const button = (event.target as HTMLElement).closest('button')
    if (!button) {
        return
    }


    const id = button.dataset.id
    entries = entries.filter(e => e.id !== id)
    saveEntries(entries)
    render()
})

//buttons for changing the screen
navBar.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest('button')

    if (!button) {
        return
    }


    //contains the id of the selected screen
    const targetScreen: string = button.dataset.screen ?? "";




    //list of all screen ids
    const screens = document.querySelectorAll<HTMLElement>('.screen')
    const screenIds = Array.from(screens).map(screen => screen.id)

    for (const id of screenIds){
        if (id != targetScreen){
            document.getElementById(id)!.hidden = true
        }
    }
    document.getElementById(targetScreen)!.hidden = false


})


addButton.addEventListener('click', () => {
    const note = input_note.value.trim()
    const calories: number = Number(input_calories.value)
    const protein: number = Number(input_protein.value)

    if (note == ""){
        input_note.classList.add('invalid')
        input_note.classList.add('shake')
        return;
    }else{
        input_note.classList.remove('invalid')
    }


    const newEntry: Entry = {
        id: crypto.randomUUID(),
        time: Date.now(),
        calories: calories,
        protein: protein,
        note: note
    }

    input_protein.value = ""
    input_calories.value = ""
    input_note.value = ""

    entries.push(newEntry)
    saveEntries(entries)
    render()
})

settings_btns.addEventListener('click', (event)=>{
    const button = (event.target as HTMLElement).closest('button')
    if (!button) {
        return
    }
    const selectedSettingsButton: string = button.dataset.setting ?? "";

    if (selectedSettingsButton == 'export_btn'){

        exportData()
    }

})


//TODO: download für PWA ermöglichen
function exportData(){
    const text = JSON.stringify(loadEntries(),null, 2)
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    const date = new Date().toISOString().slice(0, 10)   // "2026-10-26"
    a.download = `calorie-tracker-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
}

function render(){
    if (!document.startViewTransition) {
        updateDOM()
        return
    }

    // 2. Wrap the DOM update in startViewTransition
    document.startViewTransition(() => {
        updateDOM()
    })
}

function updateDOM(){
    entries = loadEntries()
    //zeigt Kcal und protein für heute an
    const date = new Date();
    date.setDate(date.getDate() + dateOffset)

    //gets the current day
    const timeToday:number = date.setHours(0, 0, 0, 0)
    const timeTodayPlus24h:number = timeToday + 86400000
    //offset date:

    entriesToday = entries.filter((entry: Entry) => (
        entry.time >= timeToday && entry.time < timeTodayPlus24h
    ));

    const sumOfCaloriesToday: number = entriesToday.reduce(
        (sum, entry) => sum  + entry.calories, 0
    );
    kcal_today.textContent = sumOfCaloriesToday.toString();
    const sumOfProteinToday: number = entriesToday.reduce(
        (sum, entry) => sum  + entry.protein, 0
    );
    protein_today.textContent = sumOfProteinToday.toString();

    //update day selector text

    if (daySelector) {
        if(dateOffset >= -6 && dateOffset <= 6){
            daySelector.textContent = rtf.format(dateOffset, 'day');
        }else{
            daySelector.textContent = (date.toLocaleDateString('en-US', { weekday: 'long' })
                    + "  "
                    + date.getDate()).toString()
                + "."
                + (date.getMonth() + 1).toString();
        }

    }




    //LIST

    const entriesTodaySortedByDate: Entry[] = entriesToday.toSorted((a, b) => b.time - a.time)
    entriesList.replaceChildren()

    //TODO: später Meldung anzeigen: "Liste leer"
    if (entriesTodaySortedByDate.length === 0){

        const emptyMessage = document.createElement('div')
        emptyMessage.className = 'empty-text'
        emptyMessage.textContent = "No entries for today"

        entriesList.appendChild(emptyMessage)
        return
    }

    for (const e of entriesTodaySortedByDate){
        const li = document.createElement('li')
        const text = document.createElement('div')
        text.className = 'entry-text'


        const main = document.createElement('div')
        const time = new Date(e.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        main.className = 'entry-main'
        main.textContent = ` ${time}  · ${e.calories} kcal · ${e.protein} g protein  `

        const sub = document.createElement('div')
        sub.className = 'entry-note'
        sub.textContent = e.note ? `${e.note}` : time

        text.append(main, sub)

        const del = document.createElement('button')
        del.type = 'button'
        del.className = 'delete'
        del.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash preview-icon"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
        del.dataset.id = e.id

        del.setAttribute('aria-label', 'Delete entry')

        li.append(text, del)
        entriesList.appendChild(li)
    }

}
render()