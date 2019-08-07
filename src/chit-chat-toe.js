
class Game {
    constructor(name) {
        this._name = name
        this._players = [],
        this._messages = []
        this._state = {
            turn: null,
            board: Array(9).fill(null),
            status: null
        }   
    }

    get name() {
        return this._name
    }

    get players() {
        return this._players.slice()
    }

    nextFreePlayer() {
        if (!this._players.includes('X')) {
            return 'X'
        }
        if (!this._players.includes('O')) {
            return 'O'
        }
        return null
    }

    addPlayer() {
        const player = this.nextFreePlayer()

        if (player !== null && !this._players.includes(player)) {
            this._players = this._players.concat(player)
        }

        return player
    }

    requiresParticipants() {
        return this._players.length === 1
    }

    startGame() {
        if (this._players.length === 2) {
            this._state = { ...this._state, turn: 'X' }
            return true
        }
        return false
    }

    gameState() {
        return { ...this._state }
    }

    isPlayersTurn(player) {
        return this._state.turn === player
    }

    makeMove(cmd) {
        const validLetters = {'a': 0,'b': 3,'c': 6 }

        const letterVal = validLetters[cmd[0]]  
        const numVal = parseInt(cmd[1],10) - 1   

        const coord = letterVal + numVal

        if (this._state.board[coord] !== null) {
            return false
        }

        const currentBoard = this._state.board.slice()
        currentBoard[coord] = this._state.turn
        const nextPlayer = this._state.turn === 'X' ? 'O' : 'X'

        this._state = { ...this.state, board: currentBoard, turn: nextPlayer }

        return true
    }

    checkResult(board) {
        const lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
          ]
    
          for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i]
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
              return `${board[a]} has won!` 
            }
          }
    
          return board.every(v => v !== null) ? 'Draw' : null;
    }

    checkWinner() {
        this._state = { ...this._state, status: this.checkResult(this._state.board) }
    }
}

class ChitChatToe {
    constructor() {
        this.state = {
            games: []
        }
    }

    joinGame() {
        let game = this.state.games.find(game => game.requiresParticipants())

        if (!game) {
            const gameId = Math.random().toString(36).substring(7)
            const gameName = `game-${gameId}`
            const g = new Game(gameName)

            this.state.games.push(g)

            game = g
        }

        const player = game.addPlayer()

        return {
            game,
            player
        }
    }

    chat(obj) {
        const gameName = obj.game
        const msg = obj.message
        const pattern = /[a-c|A-C][1-3]/i

        if (msg === 'start') {
            const game = this.state.games.find(g => g.name === gameName)
    
            if (game && game.startGame()) {
                return { action: 'START_GAME', game }
            } else {
                return { action: 'UNABLE_TO_START', game: null }
            }
        }

        const match = msg.match(pattern)
        
        if (match) {

            const game = this.state.games.find(g => g.name === gameName) 
            const currentPlayer = obj.handle

            if (game && game.isPlayersTurn(currentPlayer)) {

                if (!game.makeMove(match[0])) {
                    console.log('Invalid move', match[0], game)
                    return { action: 'INVALID_MOVE', game: null }
                }

                game.checkWinner()

                console.log(this.state)
                return { action: 'GAME_STATE_UPDATED', game: this.state.games.find(g => g.name === gameName)}
                
            } else {
                console.log(game)
                return { action: 'NOT_YOUR_TURN', game: null }
                
            }
        }

        return { action: null, game: null }
    }
}

module.exports = ChitChatToe