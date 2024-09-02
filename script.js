let currentSkill = '';
let timer = null;
let totalTime = 0;
let currentTime = 0;
let medals = 0;
let isWorking = true;
let isPaused = true;
let lastTimestamp = 0;
let totalTimeAccumulated = 0;
let totalMedalsAccumulated = 0;

// uso de localstorage
totalTimeAccumulated = parseInt(localStorage.getItem('totalTimeAccumulated') || '0');
totalMedalsAccumulated = parseInt(localStorage.getItem('totalMedalsAccumulated') || '0');

const systemSelect = document.getElementById('systemSelect');
const startPauseButton = document.getElementById('startPause');
const resetButton = document.getElementById('reset');
const timerDisplay = document.getElementById('timer');
const medalsDisplay = document.getElementById('medals');
const messageDisplay = document.getElementById('message');
const WORKING_COLOR = '#2ecc71';  // bg Verde cuando aplicando
const BREAK_COLOR = '#ff69b4';    // bg Rosa cuando descansando
const resetTotalsButton = document.getElementById('resetTotals');
resetTotalsButton.addEventListener('click', confirmResetTotals);
const MAX_HISTORY_ENTRIES = 100; // Número máximo de entradas en el historial
const skillNameInput = document.getElementById('skillName');
const saveSkillButton = document.getElementById('saveSkill');
saveSkillButton.addEventListener('click', saveSkill);
// Obtener los elementos del modal "ventana emergente" del DOM
const modal = document.getElementById('myModal');
const btn = document.getElementById("mostrarModal");
const span = document.getElementsByClassName("close")[0];

// Cuando se hace clic en el botón, se muestra el modal
btn.onclick = function () {
    modal.style.display = "block";
}

// Cuando se hace clic en el botón de cerrar, se oculta el modal
span.onclick = function () {
    modal.style.display = "none";
}

// Cuando se hace clic fuera del modal, se oculta
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}


const systems = {
    // Sistema libre
    0: { time: 359999, cycles: 1, work: 359999, shortBreak: 0, longBreak: 0 },
    // Sistema 25/5
    1: { time: 14400, cycles: 2, work: 1500, shortBreak: 300, longBreak: 0 },
    2: { time: 7200, cycles: 2, work: 1500, shortBreak: 300, longBreak: 0 },
    3: { time: 3600, cycles: 1, work: 1500, shortBreak: 300, longBreak: 0 },
    4: { time: 1800, cycles: 1, work: 1500, shortBreak: 300, longBreak: 0 },
    /*
    1: { time: 15600, cycles: 2, work: 1500, shortBreak: 300, longBreak: 1200 }, // con los breaks largos pero hay un error de logica
    2: { time: 7800, cycles: 2, work: 1500, shortBreak: 300, longBreak: 1200 }, // con los breaks largos pero hay un error de logica
    3: { time: 3600, cycles: 1, work: 1500, shortBreak: 300, longBreak: 0 },
    4: { time: 1800, cycles: 1, work: 1500, shortBreak: 300, longBreak: 0 },
    */
    // Sistema 45/15
    5: { time: 14400, cycles: 1, work: 2700, shortBreak: 900, longBreak: 0 },
    6: { time: 7200, cycles: 1, work: 2700, shortBreak: 900, longBreak: 0 },
    7: { time: 3600, cycles: 1, work: 2700, shortBreak: 900, longBreak: 0 },
    // Sistema 90/20
    8: { time: 13200, cycles: 1, work: 5400, shortBreak: 1200, longBreak: 0 },
    9: { time: 6600, cycles: 1, work: 5400, shortBreak: 1200, longBreak: 0 },
    // Sistema Combi
    10: {
        time: 12000, phases: [
            { work: 5400, break: 1200 },
            { work: 2700, break: 900 },
            { work: 1500, break: 300 }
        ]
    },
    11: {
        time: 10500, phases: [
            { work: 5400, break: 300 },
            { work: 2700, break: 300 },
            { work: 1500, break: 300 }
        ]
    },
    12: {
        time: 5400, phases: [
            { work: 2700, break: 900 },
            { work: 1500, break: 300 }
        ]
    },
    13: {
        time: 4800, phases: [
            { work: 2700, break: 300 },
            { work: 1500, break: 300 }
        ]
    }
};

// llamada inicial para mostrar los totales de localstorage
updateTotals();

startPauseButton.addEventListener('click', toggleTimer);
resetButton.addEventListener('click', resetTimer);

function toggleTimer() {
    console.log('Current Skill:', currentSkill); // Verificar el valor de currentSkill
    if (!currentSkill) {
        alert('Por favor, ingresa el nombre de tu skill a mejorar.');
        return;
    }

   if (isPaused) {
        startTimer();
    } else {
        pauseTimer();
    }
}

function saveSkill() {
    currentSkill = skillNameInput.value.trim();
    console.log('Skill guardado:', currentSkill); // Verificar el valor de currentSkill
    if (currentSkill) {
        localStorage.setItem('currentSkill', currentSkill);
        alert(`Skill "${currentSkill}" guardado.`);
        startPauseButton.disabled = false; // Habilitar el botón de comenzar
    } else {
        alert('Por favor, ingresa el nombre de tu skill a mejorar.');
        startPauseButton.disabled = true; // Deshabilitar el botón de comenzar
    }
}

function startTimer() {
    if (isPaused) {
        isPaused = false;
        startPauseButton.textContent = 'Pausar';
        if (currentTime === 0) {
            const system = systems[systemSelect.value];
            totalTime = system.time;
            currentTime = totalTime;
            medals = 0;
            updateMedals();
            isWorking = true;  // Asumimos que siempre se empieza trabajando
            updateBackgroundColor();  // Se actualiza el color de fondo al iniciar
        }
        lastTimestamp = performance.now();
        requestAnimationFrame(updateTimer);
    }
}

function pauseTimer() {
    isPaused = true;
    startPauseButton.textContent = 'Comenzar';
}

function resetTimer() {
    if (currentTime > 0 && currentTime < totalTime) {
        addToHistory();
    }
    pauseTimer();
    currentTime = 0;
    medals = 0;
    updateDisplay();
    updateMedals();
    messageDisplay.textContent = '';
    document.body.style.backgroundColor = '#f0f0f0'; // color fondo neutro
}

function updateTimer(timestamp) {
    if (!isPaused) {
        const elapsed = timestamp - lastTimestamp;
        if (elapsed >= 1000) {
            currentTime = Math.max(0, currentTime - Math.floor(elapsed / 1000));
            lastTimestamp = timestamp;
            updateDisplay();

            if (currentTime % 1800 === 0 && currentTime > 0) {
                medals++;
                updateMedals();
            }

            if (currentTime <= 0) {
                finishTimer();
            } else {
                checkPhase();
            }
        }
        requestAnimationFrame(updateTimer);
    }
}

function updateDisplay() {
    const hours = Math.floor(currentTime / 3600);
    const minutes = Math.floor((currentTime % 3600) / 60);
    const seconds = currentTime % 60;
    timerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateMedals() {
    medalsDisplay.textContent = `${medals} Medallas`;
}

function checkPhase() {
    const system = systems[systemSelect.value];

    if (system.phases) {
        // Lógica para sistemas Combi
        let elapsedTime = totalTime - currentTime;
        let currentPhase = 0;
        let timeInCurrentPhase = 0;

        for (let phase of system.phases) {
            if (elapsedTime < phase.work + phase.break) {
                timeInCurrentPhase = elapsedTime;
                break;
            }
            elapsedTime -= (phase.work + phase.break);
            currentPhase++;
        }

        const isInWorkPhase = timeInCurrentPhase < system.phases[currentPhase].work;

        if (isInWorkPhase !== isWorking) {
            isWorking = isInWorkPhase;
            updateBackgroundColor();
        }
    } else {
        // Lógica para sistemas no Combi (25/5, 45/15, 90/20)
        const cycleTime = system.work + system.shortBreak;
        const fullCycleTime = cycleTime * system.cycles + (system.longBreak || 0);
        const timeInCycle = totalTime - currentTime;

        const isInWorkPhase = timeInCycle % cycleTime < system.work;

        if (isInWorkPhase !== isWorking) {
            isWorking = isInWorkPhase;
            updateBackgroundColor();
        }
    }
}

// función para actualizar el color de fondo
function updateBackgroundColor() {
    document.body.style.backgroundColor = isWorking ? WORKING_COLOR : BREAK_COLOR;
}


function finishTimer() {
    pauseTimer();
    document.body.style.backgroundColor = '#3498db';  // Azul
    messageDisplay.textContent = "¡Felicidades! Has finalizado tu objetivo propuesto";
    medals++;
    updateMedals();
    addToHistory();
}

function addToHistory() {
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear().toString().slice(-2)} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const systemUsed = systemSelect.options[systemSelect.selectedIndex].text;
    const timeSpent = systems[systemSelect.value].time - currentTime;
    const medalsEarned = medals;

    totalTimeAccumulated += timeSpent;
    totalMedalsAccumulated += medalsEarned;

    const historyEntry = `${dateStr} | ${currentSkill || 'Sin nombre'} | ${systemUsed} | ${formatTime(timeSpent)} | ${medalsEarned} medallas`;

    let history = JSON.parse(localStorage.getItem('history') || '[]');
    history.unshift(historyEntry);
    if (history.length > MAX_HISTORY_ENTRIES) {
        history = history.slice(0, MAX_HISTORY_ENTRIES);
    }
    localStorage.setItem('history', JSON.stringify(history));

    updateHistoryDisplay(history);
    updateTotals();
}

function updateHistoryDisplay(history) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = ''; // Limpiar el historial actual
    history.forEach(entry => {
        const listItem = document.createElement('li');
        listItem.textContent = entry;
        historyList.appendChild(listItem);
    });
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('history') || '[]');
    updateHistoryDisplay(history);
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTotals() {
    const totalsDisplay = document.getElementById('totalsDisplay');
    totalsDisplay.textContent = `Total: ${formatTime(totalTimeAccumulated)} | ${totalMedalsAccumulated} medallas`;
    localStorage.setItem('totalTimeAccumulated', totalTimeAccumulated.toString());
    localStorage.setItem('totalMedalsAccumulated', totalMedalsAccumulated.toString());

    // Mostrar u ocultar el botón de reinicio
    const resetTotalsButton = document.getElementById('resetTotals');
    resetTotalsButton.style.display = (totalTimeAccumulated > 0 || totalMedalsAccumulated > 0) ? 'inline-block' : 'none';
}

function confirmResetTotals() {
    if (confirm('¿Seguro que deseas eliminar todos los datos acumulados?')) {
        totalTimeAccumulated = 0;
        totalMedalsAccumulated = 0;
        currentSkill = '';
        localStorage.removeItem('totalTimeAccumulated');
        localStorage.removeItem('totalMedalsAccumulated');
        localStorage.removeItem('history');
        localStorage.removeItem('currentSkill');

        skillNameInput.value = '';
        updateHistoryDisplay([]);
        updateTotals();
        startPauseButton.disabled = true;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    loadHistory();
    updateTotals();

    // Cargar el skill guardado, si existe
    const savedSkill = localStorage.getItem('currentSkill');
    if (savedSkill) {
        skillNameInput.value = savedSkill;
        currentSkill = savedSkill;
        startPauseButton.disabled = false;
    } else {
        startPauseButton.disabled = true;
    }
});