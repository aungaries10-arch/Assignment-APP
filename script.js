let gameState = {
    difficulty: 'medium',
    players: [],
    currentPlayer: 0,
    boardSize: 40,
    gameStarted: false
};

const difficultySettings = {
    easy: { maxHP: 150, intensity: 0.7 },
    medium: { maxHP: 100, intensity: 1.0 },
    hard: { maxHP: 75, intensity: 1.3 }
};

const events = {
    comedy: [
        { text: "A playful goblin tickles you. You laugh so hard you trip forward!", effect: { move: 2 } },
        { text: "You find a hidden stash of snacks. You feel refreshed!", effect: { hp: 5 } },
        { text: "A traveling bard tells a hilarious joke. You're too busy laughing to move!", effect: { skipTurn: true } }
    ],
    danger: [
        { text: "You step on a rusty spike trap!", effect: { hp: -10 } },
        { text: "A pack of wolves attacks!", effect: { hp: -15 } },
        { text: "A rockslide hits you!", effect: { hp: -20 } }
    ],
    mystery: [
        { text: "A mysterious hermit gives you a potion. It restores your health!", effect: { hp: 15 } },
        { text: "A portal opens and zaps you to a different spot!", effect: { move: Math.floor(Math.random() * 6) + 1 } },
        { text: "A strange energy flows through you. You lose some health but move faster!", effect: { hp: -5, move: 2 } }
    ],
    healing: [
        { text: "You rest by a shimmering spring. The water is magical!", effect: { hp: 10 } },
        { text: "You find a rare herb. It has healing properties.", effect: { hp: 15 } }
    ],
    goback: [
        { text: "A cursed wind blows you back!", effect: { move: -5 } },
        { text: "You fall into a pit and have to climb back out!", effect: { move: -8 } },
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    generateBoard();
});

function setupEventListeners() {
    document.querySelectorAll('.difficulty-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
            gameState.difficulty = e.target.textContent.toLowerCase();
        });
    });

    document.querySelector('.start-game-btn').addEventListener('click', startGame);
    document.getElementById('rollBtn').addEventListener('click', rollDice);
    document.getElementById('spellBtn').addEventListener('click', useSpell);
    document.getElementById('passiveBtn').addEventListener('click', usePassive);
    document.getElementById('skipPassiveBtn').addEventListener('click', skipPassive);
}

function generateBoard() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';
    const tiles = Array.from({ length: gameState.boardSize }, (_, i) => {
        let type = '';
        if (i === 0) type = 'start';
        else if (i === gameState.boardSize - 1) type = 'final';
        else {
            const types = ['danger', 'healing', 'mystery', 'comedy', 'goback'];
            type = types[Math.floor(Math.random() * types.length)];
        }
        return `<div class="tile ${type}" data-position="${i}">${i + 1}</div>`;
    });
    board.innerHTML = tiles.join('');
}

function startGame() {
    const playerInputs = document.querySelectorAll('.player-input');
    const playerClasses = document.querySelectorAll('.player-class');
    const players = [];

    playerInputs.forEach((input, index) => {
        const name = input.value.trim();
        const playerClass = playerClasses[index].value;
        if (name) {
            const difficulty = difficultySettings[gameState.difficulty];
            const maxHP = difficulty.maxHP;
            let passiveCount = 0;
            if (playerClass === 'warrior') passiveCount = 3;
            if (playerClass === 'mage') passiveCount = 2;
            if (playerClass === 'tank') passiveCount = 1;
            if (playerClass === 'healer') passiveCount = 2;

            players.push({
                name: name,
                class: playerClass,
                position: 0,
                hp: maxHP,
                maxHP: maxHP,
                shield: 0,
                spellCooldown: 0,
                spellActive: false,
                immunityTurns: 0,
                skipTurn: false,
                passiveCount: passiveCount
            });
        }
    });

    if (players.length < 2) {
        alert("Please enter at least two player names!");
        return;
    }

    gameState.players = players;
    gameState.gameStarted = true;
    
    document.getElementById('setupScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    addEvent("The adventure begins!");
    updateGameDisplay();
    generateBoard();
}

function updateGameDisplay() {
    updateBoard();
    updatePlayerInfo();
    updateControls();
}

function updatePlayerInfo() {
    const infoContainer = document.getElementById('playerInfo');
    infoContainer.innerHTML = '';
    gameState.players.forEach((player, index) => {
        const playerCard = document.createElement('div');
        playerCard.className = `player-status p${index + 1}`;
        if (index === gameState.currentPlayer) {
            playerCard.classList.add('current');
        }
        
        const spellCooldown = player.spellCooldown > 0 ? `(${player.spellCooldown})` : '';
        
        playerCard.innerHTML = `
            <h4>${player.name} (${player.class})</h4>
            <p>❤️ HP: ${player.hp} / ${player.maxHP}</p>
            <p>🛡️ Shield: ${player.shield}</p>
            <p>✨ Spell: ${spellCooldown}</p>
            <p>💡 Passives: ${player.passiveCount}</p>
        `;
        infoContainer.appendChild(playerCard);
    });
}

function updateControls() {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    document.getElementById('currentPlayerName').textContent = currentPlayer.name;
    const rollBtn = document.getElementById('rollBtn');
    const spellBtn = document.getElementById('spellBtn');
    
    rollBtn.disabled = false;
    
    currentPlayer.spellCooldown = Math.max(0, currentPlayer.spellCooldown - 1);
    
    if (currentPlayer.spellCooldown === 0) {
        spellBtn.classList.remove('hidden');
        spellBtn.disabled = false;
    } else {
        spellBtn.classList.remove('hidden');
        spellBtn.disabled = true;
    }
    
    if (currentPlayer.class === 'healer') {
        spellBtn.textContent = 'Heal';
    } else if (currentPlayer.class === 'warrior') {
        spellBtn.textContent = 'Charge';
    } else if (currentPlayer.class === 'mage') {
        spellBtn.textContent = 'Immunity';
    } else if (currentPlayer.class === 'tank') {
        spellBtn.textContent = 'Shield';
    }
    
    if (currentPlayer.hp <= 0) {
        rollBtn.disabled = true;
        spellBtn.disabled = true;
        addEvent(`${currentPlayer.name} is incapacitated and cannot act.`);
    }
    
    if (currentPlayer.immunityTurns > 0) {
        currentPlayer.immunityTurns--;
    }
}

function useSpell() {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (currentPlayer.spellCooldown > 0) return;
    
    switch (currentPlayer.class) {
        case 'warrior':
            currentPlayer.spellActive = true;
            currentPlayer.spellCooldown = 6;
            addEvent(`${currentPlayer.name} activates Charge! Next roll gets +3 movement!`);
            break;
            
        case 'mage':
            currentPlayer.immunityTurns = 2;
            currentPlayer.spellCooldown = 6;
            addEvent(`${currentPlayer.name} casts Immunity! Next 2 tiles have no effect!`);
            break;
            
        case 'tank':
            currentPlayer.shield += 10;
            currentPlayer.spellCooldown = 6;
            addEvent(`${currentPlayer.name} raises Shield! Gained 10 shield points!`);
            break;
            
        case 'healer':
            currentPlayer.hp = Math.min(currentPlayer.maxHP, currentPlayer.hp + 10);
            currentPlayer.spellCooldown = 6;
            addEvent(`${currentPlayer.name} casts Heal! Restored 10 HP!`);
            break;
    }
    
    updateGameDisplay();
}

function updateBoard() {
    document.querySelectorAll('.player-marker').forEach(marker => marker.remove());
    
    gameState.players.forEach((player, index) => {
        if (player.hp > 0) {
            const tile = document.querySelector(`[data-position="${player.position}"]`);
            if (tile) {
                const marker = document.createElement('div');
                marker.className = `player-marker p${index + 1}`;
                marker.textContent = index + 1;
                tile.appendChild(marker);
            }
        }
    });
}

function rollDice() {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const rollBtn = document.getElementById('rollBtn');
    const dice = document.getElementById('dice');
    
    rollBtn.disabled = true;
    
    if (currentPlayer.skipTurn) {
        currentPlayer.skipTurn = false;
        addEvent(`${currentPlayer.name} skips their turn!`);
        nextTurn();
        return;
    }
    
    dice.classList.add('rolling');
    dice.textContent = '🎲';
    
    setTimeout(() => {
        const roll = Math.floor(Math.random() * 6) + 1;
        dice.textContent = roll;
        dice.classList.remove('rolling');
        
        addEvent(`${currentPlayer.name} rolled a ${roll}!`);
        movePlayer(gameState.currentPlayer, roll);
    }, 500);
}

function movePlayer(playerIndex, spaces) {
    const player = gameState.players[playerIndex];
    const oldPosition = player.position;
    
    if (player.spellActive && player.class === 'warrior') {
        spaces += 3;
        player.spellActive = false;
        addEvent(`${player.name}'s Charge activates! +3 extra movement!`);
    }
    
    player.position = Math.min(player.position + spaces, gameState.boardSize - 1);
    
    addEvent(`${player.name} moves from ${oldPosition} to ${player.position}`);
    
    if (player.position === gameState.boardSize - 1) {
        finalChallenge(playerIndex);
        return;
    }
    
    const tile = document.querySelector(`[data-position="${player.position}"]`);
    if (tile && player.position > 0) {
        const tileType = Array.from(tile.classList).find(cls => 
            ['comedy', 'danger', 'mystery', 'healing', 'goback'].includes(cls)
        );
        
        if (tileType) {
            triggerTileEvent(playerIndex, tileType);
            return;
        }
    }
    
    updateGameDisplay();
    setTimeout(nextTurn, 1000);
}

function triggerTileEvent(playerIndex, tileType) {
    const player = gameState.players[playerIndex];
    
    if (player.immunityTurns > 0) {
        addEvent(`${player.name}'s Immunity protects them from the tile effect!`);
        updateGameDisplay();
        setTimeout(nextTurn, 1000);
        return;
    }
    
    const eventList = events[tileType];
    const event = eventList[Math.floor(Math.random() * eventList.length)];
    
    const intensity = difficultySettings[gameState.difficulty].intensity;
    let modifiedEvent = { ...event };
    
    if (event.effect.hp) {
        modifiedEvent.effect.hp = Math.floor(event.effect.hp * intensity);
    }
    
    gameState.currentEvent = { playerIndex, effect: modifiedEvent.effect, tileType };
    
    showEventModal(tileType, modifiedEvent.text, () => {
        showPassiveChoice(playerIndex, modifiedEvent.effect, tileType);
    });
}

function showPassiveChoice(playerIndex, effect, tileType) {
    const player = gameState.players[playerIndex];
    const isInFinalTiles = player.position >= gameState.boardSize - 10;
    
    if (player.passiveCount <= 0 || isInFinalTiles) {
        applyEventEffect(playerIndex, effect);
        return;
    }
    
    const passiveSection = document.getElementById('passiveSection');
    const passiveBtn = document.getElementById('passiveBtn');
    
    const passiveNames = {
        warrior: ' Skip the Tile',
        mage: ' Skip the Tile',
        tank: ' Skip the Tile',
        priest: ' Skip the Tile',
    };
    
    passiveBtn.textContent = passiveNames[player.class];
    passiveSection.classList.remove('hidden');
}

function usePassive() {
    const player = gameState.players[gameState.currentPlayer];
    const { playerIndex, effect, tileType } = gameState.currentEvent;
    
    player.passiveCount--;
    
    const passiveMessages = {
        warrior: `${player.name} used Strike! He slashed through the challenge!`,
        priest: `${player.name} used Speed Enchantment! He feels faster and more agile!`,
        tank: `${player.name} raised his Shield to block the challenge!`,
        mage: `${player.name} used Fireball! The mage burned the challenge!`
    };
    
    addEvent(passiveMessages[player.class]);
    addEvent(`${player.name} is immune to the tile effect!`);
    
    document.getElementById('passiveSection').classList.add('hidden');
    updateGameDisplay();
    setTimeout(nextTurn, 1500);
}

function skipPassive() {
    const { playerIndex, effect } = gameState.currentEvent;
    document.getElementById('passiveSection').classList.add('hidden');
    applyEventEffect(playerIndex, effect);
}

function applyEventEffect(playerIndex, effect) {
    const player = gameState.players[playerIndex];
    
    if (effect.hp) {
        if (effect.hp > 0) {
            player.hp = Math.min(player.maxHP, player.hp + effect.hp);
            addEvent(`${player.name} gains ${effect.hp} HP!`);
        } else {
            let damage = Math.abs(effect.hp);
            if (player.shield > 0) {
                const shieldAbsorbed = Math.min(player.shield, damage);
                player.shield -= shieldAbsorbed;
                damage -= shieldAbsorbed;
                addEvent(`${player.name}'s shield absorbs ${shieldAbsorbed} damage!`);
            }
            
            if (damage > 0) {
                player.hp = Math.max(0, player.hp - damage);
                addEvent(`${player.name} loses ${damage} HP!`);
            }
        }
    }
    
    if (effect.move) {
        const oldPos = player.position;
        player.position = Math.max(0, Math.min(gameState.boardSize - 1, player.position + effect.move));
        if (effect.move > 0) {
            addEvent(`${player.name} moves forward ${effect.move} spaces!`);
        } else {
            addEvent(`${player.name} moves back ${Math.abs(effect.move)} spaces!`);
        }
    }
    
    if (effect.skipTurn) {
        player.skipTurn = true;
        addEvent(`${player.name} will skip their next turn!`);
    }
    
    if (player.hp <= 0) {
        addEvent(`💀 ${player.name} has fallen! They are out of the game.`);
        
        const alivePlayers = gameState.players.filter(p => p.hp > 0);
        if (alivePlayers.length === 0) {
            showVictoryModal("💀 Game Over!", "All adventurers have fallen. The mystic realm claims another group of heroes...");
            return;
        }
    }
    
    updateGameDisplay();
    setTimeout(nextTurn, 1500);
}

function finalChallenge(playerIndex) {
    const player = gameState.players[playerIndex];
    addEvent(`${player.name} reaches the final challenge!`);
    
    showEventModal('final', `${player.name} must roll 5 or higher to claim victory!`, () => {
        const roll = Math.floor(Math.random() * 6) + 1;
        addEvent(`${player.name} rolls ${roll} for the final challenge!`);
        
        if (roll >= 5) {
            showVictoryModal("🏆 Victory Achieved!", `${player.name} has conquered the Mystic Dice Adventure! With ${player.hp} HP remaining, they claim the crown of the realm!`);
        } else {
            addEvent(`${player.name} fails the final challenge and loses 10 HP!`);
            player.hp = Math.max(0, player.hp - 10);
            
            if (player.hp <= 0) {
                addEvent(`💀 ${player.name} falls at the final challenge!`);
            } else {
                player.position = gameState.boardSize - 2;
                addEvent(`${player.name} is pushed back to try again!`);
            }
            
            updateGameDisplay();
            setTimeout(nextTurn, 1500);
        }
    });
}

function nextTurn() {
    let nextPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
    let attempts = 0;
    
    while (gameState.players[nextPlayer].hp <= 0 && attempts < gameState.players.length) {
        nextPlayer = (nextPlayer + 1) % gameState.players.length;
        attempts++;
    }
    
    if (attempts >= gameState.players.length) {
        showVictoryModal("💀 Game Over!", "All adventurers have fallen. The mystic realm claims another group of heroes...");
        return;
    }
    
    gameState.currentPlayer = nextPlayer;
    updateGameDisplay();
}

function showEventModal(type, message, callback) {
    const modal = document.getElementById('eventModal');
    const title = document.getElementById('eventTitle');
    const messageDiv = document.getElementById('eventMessage');
    const btn = document.getElementById('eventBtn');
    
    const typeEmojis = {
        comedy: '😂 Comedy Event',
        danger: '⚔️ Danger!',
        mystery: '🔮 Mystery',
        healing: '💚 Healing',
        goback: '👻 Cursed Tile',
        final: '👑 Final Challenge'
    };
    
    title.textContent = typeEmojis[type] || '🎲 Event';
    messageDiv.textContent = message;
    
    btn.onclick = () => {
        modal.classList.add('hidden');
        if (callback) callback();
    };
    modal.classList.remove('hidden');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.add('hidden');
}

function showVictoryModal(title, message) {
    const modal = document.getElementById('victoryModal');
    const titleDiv = modal.querySelector('h2');
    const messageDiv = document.getElementById('victoryMessage');
    
    titleDiv.textContent = title;
    messageDiv.innerHTML = `<p style="font-size: 1.2rem; margin-bottom: 20px;">${message}</p>`;
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('victoryModal').classList.add('hidden');
}

function addEvent(message) {
    const eventLog = document.getElementById('eventLog');
    const event = document.createElement('div');
    event.className = 'event';
    event.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    
    eventLog.insertBefore(event, eventLog.firstChild);
    
    while (eventLog.children.length > 10) {
        eventLog.removeChild(eventLog.lastChild);
    }
}

function resetGame() {
    gameState = {
        difficulty: 'medium',
        players: [],
        currentPlayer: 0,
        boardSize: 40,
        gameStarted: false
    };
    
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('setupScreen').classList.remove('hidden');
    document.getElementById('victoryModal').classList.add('hidden');
    document.getElementById('eventModal').classList.add('hidden');
    
    document.querySelectorAll('.player-input').forEach(input => input.value = '');
    document.getElementById('eventLog').innerHTML = '';
    document.getElementById('dice').textContent = '?';
    
    const spellBtn = document.getElementById('spellBtn');
    if (spellBtn) spellBtn.classList.add('hidden');
    const passiveSection = document.getElementById('passiveSection');
    if (passiveSection) passiveSection.classList.add('hidden');
    
    document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector('.difficulty-btn.medium').classList.add('selected');
    
    generateBoard();
}