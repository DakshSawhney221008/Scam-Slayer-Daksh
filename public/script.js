const socket = io();

// DOM elements
const initialScreen = document.getElementById("initialScreen");
const waitingRoom = document.getElementById("waitingRoom");
const quizScreen = document.getElementById("quizScreen");
const leaderboardScreen = document.getElementById("leaderboardScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const nicknameInput = document.getElementById("nicknameInput");
const hostBtn = document.getElementById("hostBtn");
const joinBtn = document.getElementById("joinBtn");
const statusMessage = document.getElementById("statusMessage");
const startGameBtn = document.getElementById("startGameBtn");
const waitingMessage = document.getElementById("waitingMessage");

const playersList = document.getElementById("playersList");
const questionNumber = document.getElementById("questionNumber");
const progressIndicator = document.getElementById("progressIndicator");
const timer = document.getElementById("timer");
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const waitingForOthers = document.getElementById("waitingForOthers");

const leaderboardContainer = document.getElementById("leaderboardContainer");
const nextQuestionBtn = document.getElementById("nextQuestionBtn");
const hostWaitingMessage = document.getElementById("hostWaitingMessage");

const finalLeaderboard = document.getElementById("finalLeaderboard");
const playAgainBtn = document.getElementById("playAgainBtn");

const answerPopup = document.getElementById("answerPopup");
const popupPlayer = document.querySelector(".popup-player");
const popupAnswer = document.querySelector(".popup-answer");

const soundToggle = document.getElementById("soundToggle");

// Game state
let gameState = {
	nickname: "",
	isHost: false,
	hasAnswered: false,
	currentTimer: null,
	totalPlayers: 0,
	answeredCount: 0,
	currentQuestionOptions: [],
};

// Event listeners
hostBtn.addEventListener("click", () => {
	soundSystem.play("buttonClick");
	becomeHost();
});
joinBtn.addEventListener("click", () => {
	soundSystem.play("buttonClick");
	joinGame();
});
startGameBtn.addEventListener("click", () => {
	soundSystem.play("gameStart");
	startGame();
});
nextQuestionBtn.addEventListener("click", () => {
	soundSystem.play("buttonClick");
	nextQuestion();
});
playAgainBtn.addEventListener("click", () => {
	soundSystem.play("buttonClick");
	playAgain();
});
soundToggle.addEventListener("click", toggleSound);

// Socket event listeners
socket.on("gameState", (data) => {
	// Update total players count
	gameState.totalPlayers = data.players.length;

	if (data.hasHost) {
		hostBtn.disabled = true;
		joinBtn.disabled = false;
		statusMessage.textContent =
			"A host is already selected. You can join the game!";
	} else {
		hostBtn.disabled = false;
		joinBtn.disabled = true;
		statusMessage.textContent =
			'No host selected. Click "Host Game" to become the host!';
	}

	if (data.isGameActive) {
		showScreen(quizScreen);
	} else if (data.showingLeaderboard) {
		showScreen(leaderboardScreen);
	}

	updateProgressIndicator();
});

socket.on("playerJoined", (data) => {
	soundSystem.play("playerJoin");
	updatePlayersList(data.players);
	gameState.totalPlayers = data.players.length;
	updateProgressIndicator();
});

socket.on("playerLeft", (data) => {
	updatePlayersList(data.players);
	gameState.totalPlayers = data.players.length;
	updateProgressIndicator();
});

socket.on("playerAnswered", (data) => {
	gameState.answeredCount++;
	updateProgressIndicator();
	soundSystem.play("popup");
	showAnswerPopup(data.playerNickname, data.selectedAnswer);
});

socket.on("hostSelected", (data) => {
	hostBtn.disabled = true;
	joinBtn.disabled = true;
	statusMessage.textContent = `${data.hostNickname} is now the host!`;

	if (socket.id === data.hostId) {
		gameState.isHost = true;
		showScreen(waitingRoom);
		startGameBtn.style.display = "block";
		waitingMessage.style.display = "none";
	} else {
		showScreen(waitingRoom);
		startGameBtn.style.display = "none";
		waitingMessage.style.display = "block";
	}

	updatePlayersList(data.players);
	gameState.totalPlayers = data.players.length;
	updateProgressIndicator();
});

socket.on("hostDisconnected", () => {
	alert("Host disconnected! Returning to main screen.");
	resetGame();
});

socket.on("newQuestion", (data) => {
	gameState.hasAnswered = false;
	gameState.answeredCount = 0;
	gameState.currentQuestionOptions = data.options;
	showScreen(quizScreen);

	questionNumber.textContent = `Question ${data.questionNumber} of ${data.totalQuestions}`;
	questionText.textContent = data.question;
	updateProgressIndicator();

	// Clear previous options
	optionsContainer.innerHTML = "";

	// Create option buttons
	data.options.forEach((option, index) => {
		const optionBtn = document.createElement("button");
		optionBtn.className = "option-btn";
		optionBtn.textContent = option;
		optionBtn.type = "button"; // Explicitly set button type

		// Use addEventListener instead of onclick for better reliability
		optionBtn.addEventListener("click", function (e) {
			e.preventDefault();
			e.stopPropagation();
			console.log("Button clicked:", index, option);
			selectAnswer(index, optionBtn);
		});

		optionsContainer.appendChild(optionBtn);
	});

	// Start timer
	startTimer(60);
	waitingForOthers.style.display = "none";
});

socket.on("showLeaderboard", (data) => {
	showScreen(leaderboardScreen);
	displayLeaderboard(data.players);

	if (gameState.isHost) {
		if (data.isGameOver) {
			nextQuestionBtn.textContent = "🏁 Finish Game";
		} else {
			nextQuestionBtn.textContent = "➡️ Next Question";
		}
		nextQuestionBtn.style.display = "block";
		hostWaitingMessage.style.display = "none";
	} else {
		nextQuestionBtn.style.display = "none";
		hostWaitingMessage.style.display = "block";
	}
});

socket.on("gameOver", (data) => {
	soundSystem.play("gameEnd");
	showScreen(gameOverScreen);
	displayFinalLeaderboard(data.finalLeaderboard);
});

socket.on("gameReset", (data) => {
	// Reset local game state
	gameState = {
		nickname: gameState.nickname, // Keep the nickname
		isHost: false,
		hasAnswered: false,
		currentTimer: null,
		totalPlayers: data.players.length,
		answeredCount: 0,
		currentQuestionOptions: [],
	};

	// Clear any running timers
	if (gameState.currentTimer) {
		clearInterval(gameState.currentTimer);
	}

	// Reset UI elements
	showScreen(initialScreen);
	nicknameInput.value = gameState.nickname; // Keep the nickname filled
	statusMessage.textContent =
		'No host selected. Click "Host Game" to become the host!';
	hostBtn.disabled = false;
	joinBtn.disabled = true;

	// Update players list if still in waiting room
	updatePlayersList(data.players);
	updateProgressIndicator();

	// Hide any popups
	answerPopup.classList.remove("show");
});

// Functions
function becomeHost() {
	const nickname = nicknameInput.value.trim();
	if (!nickname) {
		alert("Please enter a nickname!");
		return;
	}

	gameState.nickname = nickname;
	socket.emit("becomeHost", nickname);
}

function joinGame() {
	const nickname = nicknameInput.value.trim();
	if (!nickname) {
		alert("Please enter a nickname!");
		return;
	}

	gameState.nickname = nickname;
	socket.emit("setNickname", nickname);
	showScreen(waitingRoom);
	startGameBtn.style.display = "none";
	waitingMessage.style.display = "block";
}

function startGame() {
	if (gameState.isHost) {
		socket.emit("startGame");
	}
}

function selectAnswer(answerIndex, buttonElement) {
	console.log("selectAnswer called with index:", answerIndex);

	if (gameState.hasAnswered) {
		console.log("Already answered, ignoring");
		return;
	}

	gameState.hasAnswered = true;
	console.log("Processing answer...");

	// Play selection sound
	soundSystem.play("buttonClick");

	// Disable all option buttons and highlight selected
	const optionButtons = document.querySelectorAll(".option-btn");
	console.log("Found", optionButtons.length, "option buttons");

	optionButtons.forEach((btn) => {
		btn.disabled = true;
		if (btn === buttonElement) {
			btn.classList.add("selected");
			console.log("Highlighted selected button");
		}
	});

	console.log("Emitting submitAnswer event");
	socket.emit("submitAnswer", answerIndex);
	waitingForOthers.style.display = "block";
}

function nextQuestion() {
	if (gameState.isHost) {
		socket.emit("nextQuestion");
	}
}

function startTimer(seconds) {
	if (gameState.currentTimer) {
		clearInterval(gameState.currentTimer);
	}

	let timeLeft = seconds;
	timer.textContent = timeLeft;
	timer.classList.remove("warning");

	gameState.currentTimer = setInterval(() => {
		timeLeft--;
		timer.textContent = timeLeft;

		if (timeLeft <= 10 && timeLeft > 0) {
			timer.classList.add("warning");
			soundSystem.play("timerWarning");
		} else if (timeLeft > 10) {
			soundSystem.play("timer");
		}

		if (timeLeft <= 0) {
			clearInterval(gameState.currentTimer);

			// Auto-submit if not answered
			if (!gameState.hasAnswered) {
				const optionButtons = document.querySelectorAll(".option-btn");
				optionButtons.forEach((btn) => (btn.disabled = true));
				waitingForOthers.style.display = "block";
			}
		}
	}, 1000);
}

function updatePlayersList(players) {
	playersList.innerHTML = "<h3>👥 Players:</h3>";

	players.forEach((player) => {
		const playerDiv = document.createElement("div");
		playerDiv.className = "player-item";

		const nameDiv = document.createElement("div");
		nameDiv.className = "player-name";
		nameDiv.textContent = player.nickname;

		if (player.isHost) {
			const hostBadge = document.createElement("span");
			hostBadge.className = "host-badge";
			hostBadge.textContent = "HOST";
			nameDiv.appendChild(hostBadge);
		}

		const scoreDiv = document.createElement("div");
		scoreDiv.className = "player-score";
		scoreDiv.textContent = `${player.score || 0} pts`;

		playerDiv.appendChild(nameDiv);
		playerDiv.appendChild(scoreDiv);
		playersList.appendChild(playerDiv);
	});
}

function displayLeaderboard(players) {
	leaderboardContainer.innerHTML = "";

	players.forEach((player, index) => {
		const leaderboardItem = document.createElement("div");
		leaderboardItem.className = "leaderboard-item";

		const rank = document.createElement("div");
		rank.className = "leaderboard-rank";
		rank.textContent = `#${index + 1}`;

		const name = document.createElement("div");
		name.className = "leaderboard-name";
		name.textContent = player.nickname;

		const score = document.createElement("div");
		score.className = "leaderboard-score";
		score.textContent = `${player.score} pts`;

		leaderboardItem.appendChild(rank);
		leaderboardItem.appendChild(name);
		leaderboardItem.appendChild(score);

		leaderboardContainer.appendChild(leaderboardItem);
	});
}

function displayFinalLeaderboard(players) {
	finalLeaderboard.innerHTML = "<h3>🏆 Final Results:</h3>";

	players.forEach((player, index) => {
		const leaderboardItem = document.createElement("div");
		leaderboardItem.className = "leaderboard-item";

		const rank = document.createElement("div");
		rank.className = "leaderboard-rank";

		if (index === 0) {
			rank.textContent = "🥇";
		} else if (index === 1) {
			rank.textContent = "🥈";
		} else if (index === 2) {
			rank.textContent = "🥉";
		} else {
			rank.textContent = `#${index + 1}`;
		}

		const name = document.createElement("div");
		name.className = "leaderboard-name";
		name.textContent = player.nickname;

		const score = document.createElement("div");
		score.className = "leaderboard-score";
		score.textContent = `${player.score} pts`;

		leaderboardItem.appendChild(rank);
		leaderboardItem.appendChild(name);
		leaderboardItem.appendChild(score);

		finalLeaderboard.appendChild(leaderboardItem);
	});
}

function showScreen(screen) {
	document
		.querySelectorAll(".screen")
		.forEach((s) => s.classList.remove("active"));
	screen.classList.add("active");
}

function resetGame() {
	gameState = {
		nickname: "",
		isHost: false,
		hasAnswered: false,
		currentTimer: null,
		totalPlayers: 0,
		answeredCount: 0,
		currentQuestionOptions: [],
	};

	if (gameState.currentTimer) {
		clearInterval(gameState.currentTimer);
	}

	showScreen(initialScreen);
	nicknameInput.value = "";
	statusMessage.textContent =
		'No host selected. Click "Host Game" to become the host!';
	hostBtn.disabled = false;
	joinBtn.disabled = true;

	// Hide any popups
	answerPopup.classList.remove("show");
}

function playAgain() {
	// Emit reset game event to server
	socket.emit("resetGame");
}

// New functions for popup and progress
function showAnswerPopup(playerNickname, selectedAnswer) {
	const answerText =
		gameState.currentQuestionOptions[selectedAnswer] || "Unknown";

	popupPlayer.textContent = `${playerNickname} answered:`;
	popupAnswer.textContent = answerText;

	answerPopup.classList.add("show");

	// Hide popup after 3 seconds
	setTimeout(() => {
		answerPopup.classList.remove("show");
	}, 3000);
}

function updateProgressIndicator() {
	if (progressIndicator) {
		progressIndicator.textContent = `${gameState.answeredCount}/${gameState.totalPlayers} answered`;
	}
}

function toggleSound() {
	const isEnabled = soundSystem.toggle();
	soundToggle.textContent = isEnabled ? "🔊 Sound ON" : "🔇 Sound OFF";
	soundToggle.classList.toggle("disabled", !isEnabled);

	if (isEnabled) {
		soundSystem.play("buttonClick");
	}
}

// Initialize
nicknameInput.addEventListener("keypress", (e) => {
	if (e.key === "Enter") {
		if (!hostBtn.disabled) {
			becomeHost();
		} else if (!joinBtn.disabled) {
			joinGame();
		}
	}
});
