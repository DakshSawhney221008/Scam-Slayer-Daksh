const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

app.use(cors());
app.use(express.static("public"));

// Game state
let gameState = {
	isGameActive: false,
	host: null,
	players: {},
	currentQuestion: 0,
	questionTimer: null,
	showingLeaderboard: false,
	questions: [
		{
			question:
				"You receive an email claiming you've won $1 million, but need to pay a 'processing fee' first. What should you do?",
			options: [
				"Pay the fee immediately",
				"Delete the email",
				"Forward it to friends",
				"Call the number provided",
			],
			correct: 1,
		},
		{
			question: "Which of these is a strong password?",
			options: ["password123", "MyDog2023!", "123456789", "qwerty"],
			correct: 1,
		},
		{
			question:
				"A pop-up says your computer is infected and offers to fix it for $99. What should you do?",
			options: [
				"Pay immediately",
				"Close the pop-up and run your antivirus",
				"Call the number shown",
				"Download their 'fix' software",
			],
			correct: 1,
		},
		{
			question: "What is phishing?",
			options: [
				"A type of fishing",
				"Fraudulent attempts to obtain sensitive information",
				"A computer virus",
				"A social media platform",
			],
			correct: 1,
		},
		{
			question:
				"Someone calls claiming to be from your bank and asks for your PIN. What should you do?",
			options: [
				"Give them your PIN",
				"Hang up and call your bank directly",
				"Ask for their employee ID",
				"Transfer money to a 'safe' account",
			],
			correct: 1,
		},
		{
			question: "Which link is most likely to be suspicious?",
			options: [
				"https://amazon.com",
				"http://amaz0n-security.tk",
				"https://google.com",
				"https://microsoft.com",
			],
			correct: 1,
		},
		{
			question:
				"What should you do before clicking on email attachments?",
			options: [
				"Always open them immediately",
				"Scan them with antivirus software",
				"Forward them to friends first",
				"Open them on public computers only",
			],
			correct: 1,
		},
		{
			question:
				"A stranger on social media offers you easy money for sharing your bank details. What should you do?",
			options: [
				"Share your details",
				"Block and report them",
				"Ask for more information",
				"Share with friends first",
			],
			correct: 1,
		},
		{
			question: "What is two-factor authentication (2FA)?",
			options: [
				"Using two passwords",
				"An extra security layer requiring two forms of verification",
				"Two antivirus programs",
				"Two email accounts",
			],
			correct: 1,
		},
		{
			question:
				"You get a text saying your account will be closed unless you click a link immediately. What should you do?",
			options: [
				"Click the link quickly",
				"Ignore it and check your account directly",
				"Reply with your password",
				"Forward it to others",
			],
			correct: 1,
		},
		{
			question: "Which Wi-Fi network is safest to use?",
			options: [
				"Free public Wi-Fi",
				"Password-protected home network",
				"Open network at a café",
				"Any network with a strong signal",
			],
			correct: 1,
		},
		{
			question: "What is ransomware?",
			options: [
				"Free software",
				"Malware that encrypts files and demands payment",
				"A type of antivirus",
				"A social media app",
			],
			correct: 1,
		},
		{
			question:
				"Someone offers to help you make money by using your bank account to transfer funds. This is likely:",
			options: [
				"A great opportunity",
				"Money laundering (illegal)",
				"A legitimate job",
				"A bank promotion",
			],
			correct: 1,
		},
		{
			question: "How often should you update your passwords?",
			options: [
				"Never",
				"Regularly, especially after security breaches",
				"Only when you forget them",
				"Once a year is enough",
			],
			correct: 1,
		},
		{
			question:
				"A website asks for your Social Security Number to enter a 'free' contest. What should you do?",
			options: [
				"Provide it to enter",
				"Leave the website immediately",
				"Ask friends if it's safe",
				"Provide a fake number",
			],
			correct: 1,
		},
		{
			question: "What should you do if you think you've been scammed?",
			options: [
				"Keep it secret",
				"Report it to authorities and your bank",
				"Try to get revenge",
				"Ignore it and hope for the best",
			],
			correct: 1,
		},
		{
			question: "Which email sender is most likely legitimate?",
			options: [
				"noreply@yourbank.com",
				"security-alert@bankofamerica-verify.tk",
				"urgent@paypal-security.net",
				"admin@gmail-security.org",
			],
			correct: 0,
		},
		{
			question: "What is social engineering in cybersecurity?",
			options: [
				"Building social networks",
				"Manipulating people to reveal confidential information",
				"Engineering social media apps",
				"Creating social websites",
			],
			correct: 1,
		},
		{
			question:
				"You find a USB drive in a parking lot. What should you do?",
			options: [
				"Plug it into your computer to see what's on it",
				"Leave it where you found it",
				"Take it to security/lost and found",
				"Use it for your own files",
			],
			correct: 2,
		},
		{
			question:
				"What's the best way to verify if a suspicious email is legitimate?",
			options: [
				"Reply to the email asking",
				"Click the links to check",
				"Contact the company directly using official contact info",
				"Ask friends on social media",
			],
			correct: 2,
		},
	],
};

io.on("connection", (socket) => {
	console.log("User connected:", socket.id);

	// Send current game state to new connection
	socket.emit("gameState", {
		hasHost: !!gameState.host,
		isGameActive: gameState.isGameActive,
		showingLeaderboard: gameState.showingLeaderboard,
		players: Object.values(gameState.players),
	});

	// Handle nickname setting
	socket.on("setNickname", (nickname) => {
		gameState.players[socket.id] = {
			id: socket.id,
			nickname: nickname,
			score: 0,
			hasAnswered: false,
		};

		io.emit("playerJoined", {
			players: Object.values(gameState.players),
		});
	});

	// Handle host selection
	socket.on("becomeHost", (nickname) => {
		if (!gameState.host && !gameState.isGameActive) {
			gameState.host = socket.id;
			gameState.players[socket.id] = {
				id: socket.id,
				nickname: nickname,
				score: 0,
				hasAnswered: false,
				isHost: true,
			};

			io.emit("hostSelected", {
				hostId: socket.id,
				hostNickname: nickname,
				players: Object.values(gameState.players),
			});
		}
	});

	// Handle game start
	socket.on("startGame", () => {
		if (socket.id === gameState.host && !gameState.isGameActive) {
			gameState.isGameActive = true;
			gameState.currentQuestion = 0;

			// Reset all players' scores and answered status
			Object.keys(gameState.players).forEach((playerId) => {
				gameState.players[playerId].score = 0;
				gameState.players[playerId].hasAnswered = false;
			});

			startQuestion();
		}
	});

	// Handle answer submission
	socket.on("submitAnswer", (answerIndex) => {
		if (
			gameState.isGameActive &&
			!gameState.showingLeaderboard &&
			gameState.players[socket.id]
		) {
			const player = gameState.players[socket.id];

			if (!player.hasAnswered) {
				player.hasAnswered = true;

				// Notify all players that this player answered
				io.emit("playerAnswered", {
					playerNickname: player.nickname,
					selectedAnswer: answerIndex,
				});

				// Check if answer is correct
				if (
					answerIndex ===
					gameState.questions[gameState.currentQuestion].correct
				) {
					player.score += 1;
				}

				// Check if all players have answered
				const allAnswered = Object.values(gameState.players).every(
					(p) => p.hasAnswered
				);

				if (allAnswered) {
					showLeaderboard();
				}
			}
		}
	});

	// Handle next question
	socket.on("nextQuestion", () => {
		if (socket.id === gameState.host && gameState.showingLeaderboard) {
			gameState.currentQuestion++;

			if (gameState.currentQuestion >= gameState.questions.length) {
				// Game over
				endGame();
			} else {
				startQuestion();
			}
		}
	});

	// Handle game reset/play again
	socket.on("resetGame", () => {
		// Reset game state
		gameState.isGameActive = false;
		gameState.host = null;
		gameState.currentQuestion = 0;
		gameState.showingLeaderboard = false;
		if (gameState.questionTimer) {
			clearTimeout(gameState.questionTimer);
			gameState.questionTimer = null;
		}

		// Reset all players' scores and status
		Object.keys(gameState.players).forEach((playerId) => {
			gameState.players[playerId].score = 0;
			gameState.players[playerId].hasAnswered = false;
			gameState.players[playerId].isHost = false;
		});

		// Notify all clients to reset
		io.emit("gameReset", {
			players: Object.values(gameState.players),
		});
	});

	// Handle disconnection
	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id);

		// If host disconnects, reset game
		if (socket.id === gameState.host) {
			gameState.host = null;
			gameState.isGameActive = false;
			gameState.showingLeaderboard = false;
			if (gameState.questionTimer) {
				clearTimeout(gameState.questionTimer);
				gameState.questionTimer = null;
			}

			io.emit("hostDisconnected");
		}

		// Remove player
		delete gameState.players[socket.id];

		io.emit("playerLeft", {
			players: Object.values(gameState.players),
		});
	});
});

function startQuestion() {
	gameState.showingLeaderboard = false;

	// Reset answered status for all players
	Object.keys(gameState.players).forEach((playerId) => {
		gameState.players[playerId].hasAnswered = false;
	});

	const question = gameState.questions[gameState.currentQuestion];

	io.emit("newQuestion", {
		questionNumber: gameState.currentQuestion + 1,
		totalQuestions: gameState.questions.length,
		question: question.question,
		options: question.options,
	});

	// Start 60-second timer
	gameState.questionTimer = setTimeout(() => {
		showLeaderboard();
	}, 60000);
}

function showLeaderboard() {
	if (gameState.questionTimer) {
		clearTimeout(gameState.questionTimer);
		gameState.questionTimer = null;
	}

	gameState.showingLeaderboard = true;

	const sortedPlayers = Object.values(gameState.players).sort(
		(a, b) => b.score - a.score
	);

	io.emit("showLeaderboard", {
		players: sortedPlayers,
		isGameOver: gameState.currentQuestion >= gameState.questions.length - 1,
	});
}

function endGame() {
	gameState.isGameActive = false;
	gameState.showingLeaderboard = false;
	gameState.currentQuestion = 0;

	const finalLeaderboard = Object.values(gameState.players).sort(
		(a, b) => b.score - a.score
	);

	io.emit("gameOver", {
		finalLeaderboard: finalLeaderboard,
	});
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
