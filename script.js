// Timer configuration and state variables
const CIRCLE_CIRCUMFERENCE = 628;
let totalSeconds = 25 * 60;
let remainingSeconds = totalSeconds;
let timerInterval = null;
let isRunning = false;
let currentMode = "pomodoro";

let tasks = [];
let completedCycles = 0;

// DOM element references
const timeDisplay = document.getElementById("timeDisplay");
const currentModeText = document.getElementById("currentModeText");
const progressCircle = document.getElementById("progressCircle");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const skipBtn = document.getElementById("skipBtn");
const modeButtons = document.querySelectorAll(".mode-btn");
const sessionCountEl = document.getElementById("sessionCount");
const badgeContainer = document.getElementById("badgeContainer");
const clearCyclesBtn = document.getElementById("clearCyclesBtn");
const chimeAudio = document.getElementById("chimeAudio");

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("prioritySelect");
const formError = document.getElementById("formError");
const taskList = document.getElementById("taskList");

// Load saved tasks and cycle count from localStorage
function loadSavedData() {
    try {
        const savedCycles = localStorage.getItem("focusflow_cycles");
        const savedTasks = localStorage.getItem("focusflow_tasks");

        if (savedCycles !== null) {
            completedCycles = parseInt(savedCycles, 10) || 0;
        }
        if (savedTasks !== null) {
            tasks = JSON.parse(savedTasks);
        }
    } catch (error) {
        console.error("Storage load error:", error);
    }
    updateCycleUI();
    renderTasks();
}

// Save current tasks and cycle count to localStorage
function saveData() {
    try {
        localStorage.setItem("focusflow_cycles", completedCycles.toString());
        localStorage.setItem("focusflow_tasks", JSON.stringify(tasks));
    } catch (error) {
        console.error("Storage save error:", error);
    }
}

// Update digital clock and circular SVG ring progress
function updateTimerDisplay() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    const formattedTime =
        String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    timeDisplay.textContent = formattedTime;

    const progressFraction = (totalSeconds - remainingSeconds) / totalSeconds;
    const dashOffset = progressFraction * CIRCLE_CIRCUMFERENCE;
    progressCircle.style.strokeDashoffset = dashOffset;
}

// Play notification chime sound
function playAudioChime() {
    try {
        chimeAudio.currentTime = 0;
        chimeAudio.play();
    } catch (err) {
        console.log("Audio chime playback prevented:", err);
    }
}

// Handle actions when a timer session finishes
function handleSessionComplete() {
    pauseTimer();
    playAudioChime();

    if (currentMode === "pomodoro") {
        completedCycles++;
        saveData();
        updateCycleUI();
        alert("Focus Session Complete! You earned a ⭐ Focus Star!");
    } else {
        alert("Break finished! Ready for your next focus session.");
    }

    resetTimer();
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;

    timerInterval = setInterval(function () {
        if (remainingSeconds > 0) {
            remainingSeconds--;
            updateTimerDisplay();
        } else {
            handleSessionComplete();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
}

function resetTimer() {
    pauseTimer();
    remainingSeconds = totalSeconds;
    updateTimerDisplay();
}

function skipSession() {
    pauseTimer();
    handleSessionComplete();
}

// Mode switcher buttons (Pomodoro, Short Break, Long Break)
modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        modeButtons.forEach(function (btn) {
            btn.classList.remove("active");
        });
        button.classList.add("active");

        currentMode = button.getAttribute("data-mode");
        const minutes = parseInt(button.getAttribute("data-minutes"), 10);
        totalSeconds = minutes * 60;

        if (currentMode === "pomodoro") {
            currentModeText.textContent = "Focus Session";
        } else if (currentMode === "shortBreak") {
            currentModeText.textContent = "Short Break";
        } else {
            currentModeText.textContent = "Long Break";
        }

        resetTimer();
    });
});

// Update completed cycle counter and star badges
function updateCycleUI() {
    sessionCountEl.textContent = completedCycles;
    if (completedCycles === 0) {
        badgeContainer.textContent =
            "No cycles completed yet today. Finish a session to earn a focus badge!";
    } else {
        let stars = "";
        for (let i = 0; i < completedCycles; i++) {
            stars += "⭐ ";
        }
        badgeContainer.textContent = "Today's Earned Stars: " + stars;
    }
}

// Validate task input and add new task item
taskForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const taskTitle = taskInput.value.trim();
    const taskPriority = prioritySelect.value;

    const validTaskRegex = /^[a-zA-Z0-9\s.,!?()-]{3,60}$/;

    if (!validTaskRegex.test(taskTitle)) {
        formError.textContent =
            "Please enter a valid task name (3-60 letters/numbers, no special symbols).";
        return;
    }

    formError.textContent = "";

    const newTask = {
        id: Date.now(),
        title: taskTitle,
        priority: taskPriority,
        completed: false
    };

    tasks.push(newTask);
    taskInput.value = "";
    saveData();
    renderTasks();
});

// Render task items into the DOM
function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach(function (task) {
        const li = document.createElement("li");
        li.className = "task-item";

        const leftDiv = document.createElement("div");
        leftDiv.className = "task-left";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = task.completed;
        checkbox.addEventListener("change", function () {
            task.completed = checkbox.checked;
            saveData();
        });

        const spanText = document.createElement("span");
        spanText.className = "task-text";
        spanText.textContent = task.title;

        leftDiv.appendChild(checkbox);
        leftDiv.appendChild(spanText);

        const rightDiv = document.createElement("div");

        const priorityBadge = document.createElement("span");
        priorityBadge.className = "priority-tag priority-" + task.priority;
        priorityBadge.textContent = task.priority;

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "✕";
        deleteBtn.title = "Delete Task";
        deleteBtn.addEventListener("click", function () {
            tasks = tasks.filter(function (t) {
                return t.id !== task.id;
            });
            saveData();
            renderTasks();
        });

        rightDiv.appendChild(priorityBadge);
        rightDiv.appendChild(deleteBtn);

        li.appendChild(leftDiv);
        li.appendChild(rightDiv);
        taskList.appendChild(li);
    });
}

// Button event listeners
startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
skipBtn.addEventListener("click", skipSession);

clearCyclesBtn.addEventListener("click", function () {
    completedCycles = 0;
    saveData();
    updateCycleUI();
});

// Initialize app on page load
loadSavedData();
updateTimerDisplay();