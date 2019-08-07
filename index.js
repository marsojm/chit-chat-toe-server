const express = require('express')
const socket = require('socket.io')
const ChitChatToe = require('./src/chit-chat-toe.js')

const app = express()
const server = app.listen(4000, () => {
    console.log('Server running. Listening port 4000')
})

app.use(express.static('public'))

const io = socket(server)

const chitChatToe = new ChitChatToe()


const handleMessage = (socket, data) => {

    
    const { action, game } = chitChatToe.chat(data)
    console.log(action, game)
    switch (action) {
        case 'START_GAME':
            io.in(game.name).emit('game-state-updated', { gameState: game.gameState() })
            return
        case 'UNABLE_TO_START':
            socket.emit('notification', { message: `Can't start game. Both players need to be present.`})
            return
        case 'GAME_STATE_UPDATED':
            io.in(game.name).emit('game-state-updated', { gameState: game.gameState() })
            return
        case 'NOT_YOUR_TURN':
            socket.emit('notification', { message: `It's not your turn!`})
            return
        case 'INVALID_MOVE':   
            socket.emit('notification', { message: `Invalid move!`})
            return
        default:
            return
    }
}




const joinGame = (socket) => {

    const {game, player} = chitChatToe.joinGame()

    socket.join(game.name)
    
    socket.emit('joined-game', {message: `You have joined game '${game.name}' as ${player}`, handle: player, game: game.name, gameState: game.gameState() })
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