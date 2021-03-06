const express = require('express')
const socket = require('socket.io')
const ChitChatToe = require('./src/chit-chat-toe.js')
const port = 4000

const chitChatToe = new ChitChatToe()

const app = express()

const server = app.listen(port, () => {
    console.log(`Server running. Listening port ${port}`)
})

app.use(express.static('public'))

app.get('/reset', (req, res) => {
    chitChatToe.reset()
    
    res.send('Reset success')
})

const io = socket(server)




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
    socket.to(game.name).emit('participant-joined-game', { message: `Another player has joined the game as ${player}`, gameState: game.gameState()})

    socket.on('disconnect', (reason) => {
        console.log(`Player '${player}' disconnected from game '${game.name}'`)
        const newState = chitChatToe.leaveGame(player, game.name).gameState()

        socket.to(game.name).emit('notification', { message: `Player '${player}' disconnected from game '${game.name}'`})
        io.to(game.name).emit('game-state-updated', { gameState: newState })
    });
}



io.on('connection', (socket) => {
    joinGame(socket)

    socket.on('chat', (data) => {
        handleMessage(socket, data)

        io.in(data.game).emit('chat', data)
    })

    socket.on('typing', (data) => {
        console.log(`${data.game}: player ${data.handle} is typing...`)
        socket.to(data.game).emit('typing', data)
    })

    
})