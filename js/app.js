// Constants
const MILESTONES = [700, 3500, 7000, 10500, 14000];
const HOUSES = [
     // Harkonnen Houses
     { name: 'Alexin', faction: 'Harkonnen', location: 'Harko Village' },
     { name: 'Hurata', faction: 'Harkonnen', location: 'Hagga Basin' },
     { name: 'Moritani', faction: 'Harkonnen', location: 'Hagga Basin (RiftWatch)' },
     { name: 'Wallach', faction: 'Harkonnen', location: 'Arrakeen' },
     { name: 'Noverbruns', faction: 'Harkonnen', location: 'Hagga Basin (Vermilius Gap)' },
     
     // Atreides Houses
     { name: 'Ecaz', faction: 'Atreides', location: 'Hagga Basin' },
     { name: 'Richese', faction: 'Atreides', location: 'Hagga Basin (Helius Gate)' },
     { name: 'Vernius', faction: 'Atreides', location: 'Hagga Basin (Helius Gate)' },
     { name: 'Mikarrol', faction: 'Atreides', location: 'Hagga Basin (Jabal Eifrit)' },
     { name: 'Imota', faction: 'Atreides', location: 'Hagga Basin' },
     
     // Neutral Houses
     { name: 'Argosaz', faction: 'Neutral', location: 'Hagga Basin (Griffin\'s Reach)' },
     { name: 'Dyvetz', faction: 'Neutral', location: 'Hagga Basin (Eastern Part)' },
     { name: 'Hagal', faction: 'Neutral', location: 'Deep Hagga Basin' },
     { name: 'Kenola', faction: 'Neutral', location: 'Hagga Basin (O\'odham)' },
     { name: 'Lindaren', faction: 'Neutral', location: 'Hagga Basin (Shield Wall)' },
     
     // Corrino Houses
     { name: 'Varota', faction: 'Corrino', location: 'Arrakeen (Imperial Consulate)' },
     { name: 'Mutelli', faction: 'Corrino', location: 'Arrakeen' },
     { name: 'Tseida', faction: 'Corrino', location: 'The Anvil Tradepost' },
     { name: 'Taligari', faction: 'Corrino', location: 'The Crossroads Tradepost' },
     { name: 'Sor', faction: 'Corrino', location: 'Pinnacle Station' },
     
     // Nomadic Houses
     { name: 'Maros', faction: 'Nomadic', location: 'Deep Desert (Rotating)' },
     { name: 'Wayku', faction: 'Nomadic', location: 'Deep Desert (Rotating Camps)' },
     { name: 'Spinette', faction: 'Nomadic', location: 'Harko Village' },
     { name: 'Thorvald', faction: 'Nomadic', location: 'Hagga Basin (Peripheral Mines)' },
     { name: 'Wydras', faction: 'Nomadic', location: 'Hagga Basin (Sheol)' }
 
].sort((a, b) => a.name.localeCompare(b.name));

// DOM Elements
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const modalHouseName = document.getElementById('modalHouseName');
const taskDescription = document.getElementById('taskDescription');
const pointsPerUnit = document.getElementById('pointsPerUnit');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const housesContainer = document.getElementById('housesContainer');
const houseCardTemplate = document.getElementById('houseCardTemplate');

// State
let currentHouseName = '';

// Initialize the application
function init() {
    loadHouses();
    renderHouses();
    setupEventListeners();
}

// Load houses from localStorage
function loadHouses() {
    let houses = [];
    const savedHouses = localStorage.getItem('landsraadHouses');
    
    if (savedHouses) {
        houses = JSON.parse(savedHouses);
        
        // Normalize existing data to include new fields/lengths
        houses = houses.map(h => {
            const normalized = { ...h };
            // Ensure claimed exists and matches milestones length
            if (!Array.isArray(normalized.claimed)) {
                normalized.claimed = Array(MILESTONES.length).fill(false);
            } else if (normalized.claimed.length !== MILESTONES.length) {
                normalized.claimed = Array.from({ length: MILESTONES.length }, (_, i) => !!normalized.claimed[i]);
            }
            // Ensure levelsCompleted exists and matches milestones length
            if (!Array.isArray(normalized.levelsCompleted)) {
                normalized.levelsCompleted = Array(MILESTONES.length).fill(false);
            } else if (normalized.levelsCompleted.length !== MILESTONES.length) {
                normalized.levelsCompleted = Array.from({ length: MILESTONES.length }, (_, i) => !!normalized.levelsCompleted[i]);
            }
            // Keep legacy numeric completed but no longer used
            if (typeof normalized.completed !== 'number') {
                normalized.completed = 0;
            }
            return normalized;
        });
        
        // Ensure all HOUSES are present in the saved data
        const savedHouseNames = houses.map(h => h.name);
        const missingHouses = HOUSES.filter(house => !savedHouseNames.includes(house.name));
        
        missingHouses.forEach(house => {
            houses.push({
                name: house.name,
                task: '',
                pointsPerUnit: 0,
                completed: 0,
                claimed: Array(MILESTONES.length).fill(false),
                levelsCompleted: Array(MILESTONES.length).fill(false)
            });
        });
        
        // Sort to maintain consistent order
        houses.sort((a, b) => {
            const houseA = HOUSES.find(h => h.name === a.name);
            const houseB = HOUSES.find(h => h.name === b.name);
            return HOUSES.indexOf(houseA) - HOUSES.indexOf(houseB);
        });
        
        // Save the updated list
        localStorage.setItem('landsraadHouses', JSON.stringify(houses));
    } else {
        // Initialize with default houses if no data exists
        houses = HOUSES.map(house => ({
            name: house.name,
            task: '',
            pointsPerUnit: 0,
            completed: 0,
            claimed: Array(MILESTONES.length).fill(false),
            levelsCompleted: Array(MILESTONES.length).fill(false)
        }));
        localStorage.setItem('landsraadHouses', JSON.stringify(houses));
    }
    
    return houses;
}

// Get all houses from localStorage
function getHouses() {
    return JSON.parse(localStorage.getItem('landsraadHouses') || '[]');
}

// Save houses to localStorage
function saveHouses(houses) {
    localStorage.setItem('landsraadHouses', JSON.stringify(houses));
}

// Calculate items needed for each milestone
function calculateItemsNeeded(house) {
    if (!house.pointsPerUnit || house.pointsPerUnit <= 0) return [];
    
    return MILESTONES.map(milestone => {
        return Math.ceil(milestone / house.pointsPerUnit);
    });
}

// Get house details by name
function getHouseDetails(houseName) {
    return HOUSES.find(house => house.name === houseName) || { name: houseName, faction: 'Unknown', location: 'Unknown' };
}

// Render all houses
function renderHouses() {
    housesContainer.innerHTML = '';
    const houses = getHouses();
    
    // Ensure we have all houses in the correct order
    const orderedHouses = [];
    HOUSES.forEach(houseObj => {
        const house = houses.find(h => h.name === houseObj.name) || {
            name: houseObj.name,
            task: '',
            pointsPerUnit: 0,
            completed: 0,
            claimed: Array(MILESTONES.length).fill(false),
            levelsCompleted: Array(MILESTONES.length).fill(false)
        };
        orderedHouses.push(house);
    });
    
    orderedHouses.forEach(house => {
        
        const card = houseCardTemplate.content.cloneNode(true);
        const cardElement = card.querySelector('.house-card') || card.firstElementChild;
        cardElement.classList.add('house-card');
        cardElement.dataset.houseName = house.name;
        
        // Get house details
        const houseDetails = getHouseDetails(house.name);
        
        // Set house data
        cardElement.querySelector('.house-name').textContent = house.name;
        
        // Add faction and location info
        const factionLocationEl = document.createElement('div');
        factionLocationEl.className = 'text-xs mb-2';
        factionLocationEl.innerHTML = `<span class="font-semibold faction-tag">${houseDetails.faction}</span> - <span class="text-amber-300">${houseDetails.location}</span>`;
        cardElement.querySelector('.p-4.border-b').insertBefore(factionLocationEl, cardElement.querySelector('.task-info'));
        
        // Set faction data attribute for styling
        cardElement.dataset.faction = houseDetails.faction;
        
        const taskInfo = cardElement.querySelector('.task-info');
        const taskDescriptionEl = cardElement.querySelector('.task-description');
        const pointsPerUnitEl = cardElement.querySelector('.points-per-unit');
        
        if (house.task) {
            taskDescriptionEl.textContent = house.task;
            pointsPerUnitEl.textContent = house.pointsPerUnit;
            // Calculate items needed for each milestone and render rows with toggles
            const itemsNeeded = calculateItemsNeeded(house);
            const itemsNeededEl = cardElement.querySelector('.items-needed');
            itemsNeededEl.innerHTML = '';
            
            itemsNeeded.forEach((items, i) => {
                const row = document.createElement('div');
                row.className = 'flex justify-between items-center py-1';
                
                const left = document.createElement('div');
                const label = document.createElement('span');
                label.textContent = `(${MILESTONES[i]} pts):`;
                const value = document.createElement('span');
                value.className = 'font-mono text-white ml-2';
                value.textContent = `${items}`;
                left.appendChild(label);
                left.appendChild(value);
                
                const toggles = document.createElement('div');
                toggles.className = 'flex items-center gap-3';
                
                // Completed toggle
                const completedWrap = document.createElement('label');
                completedWrap.className = 'checkbox-container text-xs text-amber-200';
                const completedCb = document.createElement('input');
                completedCb.type = 'checkbox';
                completedCb.checked = !!house.levelsCompleted?.[i];
                completedCb.addEventListener('change', () => toggleLevelCompleted(house.name, i));
                const completedText = document.createElement('span');
                completedText.textContent = 'Hecho';
                completedWrap.appendChild(completedCb);
                completedWrap.appendChild(completedText);
                
                // Claimed toggle
                const claimedWrap = document.createElement('label');
                claimedWrap.className = 'checkbox-container text-xs text-amber-200';
                const claimedCb = document.createElement('input');
                claimedCb.type = 'checkbox';
                claimedCb.checked = !!house.claimed?.[i];
                claimedCb.addEventListener('change', () => toggleClaimed(house.name, i));
                const claimedText = document.createElement('span');
                claimedText.textContent = 'Reclamada';
                claimedWrap.appendChild(claimedCb);
                claimedWrap.appendChild(claimedText);
                
                toggles.appendChild(completedWrap);
                toggles.appendChild(claimedWrap);
                
                row.appendChild(left);
                row.appendChild(toggles);
                itemsNeededEl.appendChild(row);
            });
            
            // Show task info
            taskInfo.classList.remove('hidden');
            
            // Change assign task button to edit
            const assignBtn = cardElement.querySelector('.assign-task-btn');
            assignBtn.textContent = 'Editar Tarea';
            assignBtn.classList.remove('bg-amber-800');
            assignBtn.classList.add('bg-blue-800', 'hover:bg-blue-700');
            
            // Add reset button
            const resetBtn = document.createElement('button');
            resetBtn.className = 'mt-2 w-full bg-red-900 hover:bg-red-800 text-white text-sm font-medium py-1 px-3 rounded transition duration-200';
            resetBtn.textContent = 'Resetear Tarea';
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                resetHouseTask(house.name);
            });
            
            cardElement.querySelector('.p-4:last-child').appendChild(resetBtn);
        } else {
            // Show empty state for houses without tasks
            taskDescriptionEl.textContent = 'Sin tarea asignada';
            pointsPerUnitEl.textContent = '0';
            
            // Show items needed placeholder (requires task to compute)
            const itemsNeededEl = cardElement.querySelector('.items-needed');
            itemsNeededEl.innerHTML = '<div class="text-xs text-amber-200">Asigna una tarea para calcular los items necesarios.</div>';
        }
        
        // Set up assign task button
        const assignBtn = cardElement.querySelector('.assign-task-btn');
        assignBtn.addEventListener('click', () => openTaskModal(house.name));
        
        housesContainer.appendChild(card);
    });
}

// Toggle claimed status for a milestone
function toggleClaimed(houseName, milestoneIndex) {
    const houses = getHouses();
    const houseIndex = houses.findIndex(h => h.name === houseName);
    
    if (houseIndex !== -1) {
        houses[houseIndex].claimed[milestoneIndex] = !houses[houseIndex].claimed[milestoneIndex];
        saveHouses(houses);
        renderHouses();
    }
}

// Toggle completed status for a milestone
function toggleLevelCompleted(houseName, milestoneIndex) {
    const houses = getHouses();
    const houseIndex = houses.findIndex(h => h.name === houseName);
    
    if (houseIndex !== -1) {
        if (!Array.isArray(houses[houseIndex].levelsCompleted)) {
            houses[houseIndex].levelsCompleted = Array(MILESTONES.length).fill(false);
        }
        houses[houseIndex].levelsCompleted[milestoneIndex] = !houses[houseIndex].levelsCompleted[milestoneIndex];
        saveHouses(houses);
        renderHouses();
    }
}

// Update house progress
function updateHouseProgress(houseName, quantity) {
    if (quantity <= 0) return;
    
    const houses = getHouses();
    const houseIndex = houses.findIndex(h => h.name === houseName);
    
    if (houseIndex !== -1) {
        houses[houseIndex].completed += quantity;
        saveHouses(houses);
        renderHouses();
    }
}

// Reset house task
function resetHouseTask(houseName) {
    if (!confirm(`¿Estás seguro de que quieres resetear la tarea de la casa ${houseName}? Se eliminarán todos los datos de progreso.`)) {
        return;
    }
    
    const houses = getHouses();
    const houseIndex = houses.findIndex(h => h.name === houseName);
    
    if (houseIndex !== -1) {
        // Reset the house data
        houses[houseIndex] = {
            name: houseName,
            task: '',
            pointsPerUnit: 0,
            completed: 0,
            claimed: Array(MILESTONES.length).fill(false),
            levelsCompleted: Array(MILESTONES.length).fill(false)
        };
        
        saveHouses(houses);
        renderHouses();
    }
}

// Open task assignment modal
function openTaskModal(houseName) {
    currentHouseName = houseName;
    modalHouseName.textContent = houseName;
    
    // Load existing task data if available
    const houses = getHouses();
    const house = houses.find(h => h.name === houseName);
    
    if (house && house.task) {
        taskDescription.value = house.task;
        pointsPerUnit.value = house.pointsPerUnit;
    } else {
        taskDescription.value = '';
        pointsPerUnit.value = '';
    }
    
    taskModal.classList.remove('hidden');
    taskDescription.focus();
}

// Close task assignment modal
function closeTaskModal() {
    taskModal.classList.add('hidden');
    currentHouseName = '';
    taskForm.reset();
}

// Set up event listeners
function setupEventListeners() {
    // Handle task form submission
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const task = taskDescription.value.trim();
        const points = parseInt(pointsPerUnit.value);
        
        if (!task || isNaN(points) || points <= 0) {
            alert('Por favor completa todos los campos correctamente.');
            return;
        }
        
        const houses = getHouses();
        const houseIndex = houses.findIndex(h => h.name === currentHouseName);
        
        if (houseIndex === -1) {
            // Add new house with task
            houses.push({
                name: currentHouseName,
                task,
                pointsPerUnit: points,
                completed: 0,
                claimed: Array(MILESTONES.length).fill(false),
                levelsCompleted: Array(MILESTONES.length).fill(false)
            });
        } else {
            // Update existing house task
            houses[houseIndex] = {
                ...houses[houseIndex],
                task,
                pointsPerUnit: points,
                completed: 0,
                claimed: Array(MILESTONES.length).fill(false),
                levelsCompleted: Array(MILESTONES.length).fill(false)
            };
        }
        
        saveHouses(houses);
        closeTaskModal();
        renderHouses();
    });
    
    // Cancel button
    cancelTaskBtn.addEventListener('click', closeTaskModal);
    
    // Close modal when clicking outside
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            closeTaskModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !taskModal.classList.contains('hidden')) {
            closeTaskModal();
        }
    });
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
