const express = require('express')
const socket = require('socket.io')

const app = express()
const server = app.listen(4000, () => {
    console.log('Server running. Listening port 4000')
})

app.use(express.static('public'))

const io = socket(server)


const STATE = {
    games: [
    ]
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

const handleMessage = (socket, data) => {
    const gameName = data.game
    const msg = data.message
    const pattern = /[a-c|A-C]+[1-3]/i

    if (msg === '/start') {
        const game = STATE.games.find(g => g.name === gameName)

        if (game && game.players.length === 2) {
            game.gameState = {...game.gameState, turn: 'X'}

            io.in(game.name).emit('game-state-updated', { gameState: game.gameState })
        } else {
            socket.emit('notification', { message: `Can't start game. Both players need to be present.`})
        }
        return
    } 

    const match = msg.match(pattern)
    const validLetters = {'a': 0,'b': 3,'c': 6 }
    if (match) {
        const cmd = match[0]

        const letterVal = validLetters[cmd[0]]  
        const numVal = parseInt(cmd[1],10) - 1   

        const coord = letterVal + numVal

        const game = STATE.games.find(g => g.name === gameName) 
        const currentPlayer = data.handle

        if (game && currentPlayer === game.gameState.turn) {
            STATE.games = STATE.games.map(g => {
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

            io.in(game.name).emit('game-state-updated', { gameState: STATE.games.find(g => g.name === gameName).gameState })
        } else {
            socket.emit('notification', { message: `It's not your turn!`})
        }
    }
}


const initGame = () => {
    return {
        turn: null,
        result: null,
        board: Array(9).fill(null)
    }
}

const joinGame = (socket) => {
    let game = STATE.games.find(game => game.players.length === 1)

    if (!game) {
        const gameId = Math.random().toString(36).substring(7)
        const g = {
            name: `game-${gameId}`,
            players: [],
            messages: []
        }

        STATE.games.push(g)

        game = g
    }

    const player = game.players.indexOf('X') === -1 ? 'X' : 'O'
    STATE.games = STATE.games.map(g => {
        if (g.name === game.name) {
            return {...game,  players: game.players.concat(player), gameState: initGame() }
        }
        return g
    }) 

    socket.join(game.name)
    
    socket.emit('joined-game', {message: `You have joined game '${game.name}' as ${player}`, handle: player, game: game.name })
    socket.to(game.name).emit('participant-joined-game', { message: `Another player has joined the game as ${player}`})

}



io.on('connection', (socket) => {
    joinGame(socket)

    socket.on('chat', (data) => {
        // emit to all sockets
        handleMessage(socket, data)

        io.in(data.game).emit('chat', data)
    })

    socket.on('typing', (data) => {
        io.to(data.game).emit('typing', data)
    })

    
})