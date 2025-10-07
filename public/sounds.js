// Sound System for SCam Slayer
class SoundSystem {
	constructor() {
		this.audioContext = null;
		this.sounds = {};
		this.enabled = true;
		this.volume = 0.3;
		this.init();
	}

	init() {
		// Initialize AudioContext on first user interaction
		document.addEventListener(
			"click",
			() => {
				if (!this.audioContext) {
					this.audioContext = new (window.AudioContext ||
						window.webkitAudioContext)();
					this.createSounds();
				}
			},
			{ once: true }
		);
	}

	createSounds() {
		// Create different sound effects using oscillators
		this.sounds = {
			correct: () => this.playTone([523, 659, 784], 0.2, "sine"), // C-E-G major chord
			incorrect: () => this.playTone([220, 185, 165], 0.3, "sawtooth"), // Descending error sound
			timer: () => this.playTone([440], 0.1, "square"), // Timer tick
			timerWarning: () => this.playTone([880, 440], 0.2, "triangle"), // Warning beep
			gameStart: () => this.playTone([262, 330, 392, 523], 0.15, "sine"), // Start melody
			gameEnd: () =>
				this.playTone([523, 494, 440, 392, 349, 330], 0.2, "sine"), // End melody
			playerJoin: () => this.playTone([392, 523], 0.1, "sine"), // Join sound
			buttonClick: () => this.playTone([880], 0.05, "square"), // Button click
			popup: () => this.playTone([659, 784], 0.1, "sine"), // Popup notification
		};
	}

	playTone(frequencies, duration, type = "sine") {
		if (!this.audioContext || !this.enabled) return;

		frequencies.forEach((freq, index) => {
			const oscillator = this.audioContext.createOscillator();
			const gainNode = this.audioContext.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(this.audioContext.destination);

			oscillator.frequency.setValueAtTime(
				freq,
				this.audioContext.currentTime
			);
			oscillator.type = type;

			gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
			gainNode.gain.linearRampToValueAtTime(
				this.volume,
				this.audioContext.currentTime + 0.01
			);
			gainNode.gain.linearRampToValueAtTime(
				0,
				this.audioContext.currentTime + duration
			);

			const startTime = this.audioContext.currentTime + index * 0.1;
			oscillator.start(startTime);
			oscillator.stop(startTime + duration);
		});
	}

	play(soundName) {
		if (this.sounds[soundName]) {
			this.sounds[soundName]();
		}
	}

	toggle() {
		this.enabled = !this.enabled;
		return this.enabled;
	}

	setVolume(volume) {
		this.volume = Math.max(0, Math.min(1, volume));
	}
}

// Global sound system instance
const soundSystem = new SoundSystem();
