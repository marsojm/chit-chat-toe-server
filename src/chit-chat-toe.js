const initGame = () => {
    return {
        turn: null,
        result: null,
        board: Array(9).fill(null)
    }
}

const checkResult = (board) => {
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

class ChitChatToe {
    constructor() {
        this.state = {
            games: []
        }
    }

    joinGame() {
        let game = this.state.games.find(game => game.players.length === 1)

        if (!game) {
            const gameId = Math.random().toString(36).substring(7)
            const g = {
                name: `game-${gameId}`,
                players: [],
                messages: []
            }

            this.state.games.push(g)

            game = g
        }

        const player = game.players.indexOf('X') === -1 ? 'X' : 'O'
        this.state.games = this.state.games.map(g => {
            if (g.name === game.name) {
                return {...game,  players: game.players.concat(player), gameState: initGame() }
            }
            return g
        })
        console.log(this.state)
        return {
            game,
            player
        }
    }

    chat(obj) {
        const gameName = obj.game
        const msg = obj.message
        const pattern = /[a-c|A-C][1-3]/i

        if (msg === '/start') {
            const game = this.state.games.find(g => g.name === gameName)
    
            if (game && game.players.length === 2) {
                game.gameState = {...game.gameState, turn: 'X'}
                console.log(this.state)
                return { action: 'START_GAME', game }

            } else {
                return { action: 'UNABLE_TO_START', game: null }
            }
        }

        const match = msg.match(pattern)
        const validLetters = {'a': 0,'b': 3,'c': 6 }
        if (match) {
            const cmd = match[0]

            const letterVal = validLetters[cmd[0]]  
            const numVal = parseInt(cmd[1],10) - 1   

            const coord = letterVal + numVal

            const game = this.state.games.find(g => g.name === gameName) 
            const currentPlayer = obj.handle

            if (game && currentPlayer === game.gameState.turn) {
                const currentBoard = this.state.games.find(g => g.name === gameName).gameState.board
                if (currentBoard[coord] !== null) {
                    console.log('Invalid move')
                    return { action: 'INVALID_MOVE', game: null }
                }

                this.state.games = this.state.games.map(g => {
                    if (g.name === game.name) {
                        let nextPlayer = game.gameState.turn === 'X' ? 'O' : 'X'
                        const board = game.gameState.board.slice()

                        

                        board[coord] = currentPlayer
                        const result = checkResult(board)
                        if (result) {
                            nextPlayer = null
                        }

                        const gameState = {...game.gameState, turn: nextPlayer, board: board, result: result }
                        const newGame = {...game, gameState: gameState }

                        return newGame
                    }
                    return g
                })
                console.log(this.state)
                return { action: 'GAME_STATE_UPDATED', game: this.state.games.find(g => g.name === gameName)}
                
            } else {

                return { action: 'NOT_YOUR_TURN', game: null }
                
            }
        }

        return { action: null, game: null }
    }
}

module.exports = ChitChatToe