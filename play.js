// Load sound files along with the hue of the button colors
const btnDescriptions = [
    {file: 'sound1.mp3', hue: 120},
    {file: 'sound2.mp3', hue: 0},
    {file: 'sound3.mp3', hue: 51},
    {file: 'sound4.mp3', hue: 220},
];

class Button {
    constructor(description, el) {
        this.el = el;
        this.hue = description.hue
        this.sound = loadSound(description.file);
        this.paint(25);
    }

    paint(level) {
        const background = `hsl(${this.hue}, 100%, ${level}%)`;
        this.el.style.backgroundColor = background;
    }

    async press(volume) {
        this.paint(50);
        await this.play(volume);
        this.paint(25);
    }

    async play(volume = 1.0) {
        this.sound.volume = volume;
        await new Promise((resolve) => {
            this.sound.onended = resolve;
            this.sound.play();
        });
    }
}

class Game {
    buttons;
    allowPlayer;
    sequence;
    playerPlaybackPos;
    mistakeSound;

    constructor() {
        this.buttons = new Map();
        this.allowPlayer = false;
        this.sequence = [];
        this.playerPlaybackPos = 0;
        this.mistakeSound = loadSound('error.mp3');

        document.querySelectorAll('.game-button').forEach((el, i) => {
            if (i < btnDescriptions.length) {
                console.log(el.id);
                this.buttons.set(el.id, new Button(btnDescriptions[i], el));
            }
        });

        const playerNameEl = document.querySelector('.player-name');
        playerNameEl.textContent = this.getPlayerName();
    }

    async pressButton(button) {
        if (this.allowPlayer) {
            this.allowPlayer = false;
            await this.buttons.get(button.id).press(1.0);

            if (this.sequence[this.playerPlaybackPos].el.id === button.id) {
                this.playerPlaybackPos++;
                if (this.playerPlaybackPos === this.sequence.length) {
                    this.playerPlaybackPos = 0;
                    this.addButton();
                    this.updateScore(this.sequence.length - 1);
                    await this.playSequence();
                }
                this.allowPlayer = true;
            } else {
                this.saveScore(this.sequence.length - 1);
                this.mistakeSound.play();
                await this.buttonDance(2);
            }
        }
    }

    async reset() {
        this.allowPlayer = false;
        this.playerPlaybackPos = 0;
        this.sequence = [];
        this.updateScore('--');
        await this.buttonDance(1);
        this.addButton();
        await this.playSequence();
        this.allowPlayer = true;
    }

    getPlayerName() {
        return localStorage.getItem('userName') ?? 'Mystery player';
    }

    async playSequence() {
        await delay(500);
        for (const btn of this.sequence) {
            await btn.press(1.0);
            await delay(100);
        }
    }

    addButton() {
        const btn = this.getRandomButton();
        this.sequence.push(btn);
    }

    updateScore(score) {
        const scoreEl = document.querySelector('#score');
        scoreEl.textContent = score;
    }

    // Review this code better
    // ANSWER: I was just confused by what a "button dance" was but now I understand this is the little animation that plays before each game
    async buttonDance(laps = 1) {
        for (let step = 0; step < laps; step++) {
            for (const btn of this.buttons.values()) {
                await btn.press(0.0);
            }
        }
    }

    // Review where buttons is used
    getRandomButton() {
        let buttons = Array.from(this.buttons.values());
        return buttons[Math.floor(Math.random() * this.buttons.size)];
    }

    // Review this code better
    // ANSWER: first this function gets the current player name and stores it in userName
    // Next, the function declares an empty array scores
    // The array from the local storage database is retrieved
    // If there is data exists in local storage, then the scores array declared earlier is set to those values from local storage
    // scores is then updated with the new score to be added to the existing local storage array
    saveScore(score) {
        const userName = this.getPlayerName();
        let scores = [];
        const scoresText = localStorage.getItem('scores');
        if (scoresText) {
            scores = JSON.parse(scoresText);
        }
        scores = this.updateScores(userName, score, scores);

        localStorage.setItem('scores', JSON.stringify(scores));
    }

    updateScores(userName, score, scores) {
        const date = new Date().toLocaleDateString();
        const newScore = {name: userName, score: score, date: date};

        let found = false;
        for (const [i, prevScore] of scores.entries()) {
            if (score > prevScore.score) {
                // Review the array.splice() method
                // ANSWER: array.splice(index, howmany(items to be removed), item1, ..., itemX);
                scores.splice(i, 0, newScore);
                found = true;
                break;
            }
        }

        if (!found) {
            scores.push(newScore);
        }
        // what is the purpose of the code below?
        // ANSWER: As far as I can understand, it is simply limited the number of saved 
        // games to 10 in the local storage database. Is this for performance reasons?
        if (scores.length > 10) {
            scores.length = 10;
        }

        return scores;
    }
}

const game = new Game();

// Understand this function better
// ANSWER: This function takes an integer number as input, and basically creates
// a delay in the operation of the game so the user can see the differences in the
// button sequence
function delay(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, milliseconds);
    });
}

function loadSound(filename) {
    return new Audio('assets/' + filename);
}