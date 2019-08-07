
const Game = require('./game')



class ChitChatToe {
    constructor() {
        this.state = {
            games: []
        }
    }

    reset() {
        this.state = {...this.state, games: []}
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

    leaveGame(player, gameName) {
        const game = this.state.games.find(g => g.name === gameName)
        game.removePlayer(player)

        if (game.players.length === 0) {
            this.state = {...this.state, games: this.state.games.filter(g => g.name !== gameName) }
        }

        return game
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