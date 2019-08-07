
const socket = io.connect('http://localhost:4000')

const message = document.getElementById('message')
const handle = document.getElementById('handle')
const visibleHandle = document.getElementById('visibleHandle')
const btn = document.getElementById('send')
const output = document.getElementById('output')
const feedback = document.getElementById('feedback')
const gameIdentifier = document.getElementById('game-identifier')
const turnDOM = document.getElementById('turn')
const resultDOM = document.getElementById('result')


let game = null
const STATE = {
    gameState: {
        turn: null,
        status: null,
        board: Array(9).fill(null)
    }
}

function renderGameState() {
    let turnText = ''
    let resultText = ''

    if (STATE.gameState.turn != null && STATE.gameState.status === null) {
        turnText = STATE.gameState.turn === handle.value ? `It's your turn!` : 'Waiting for other player to make a move...'
    }

    if (STATE.gameState.status != null) {
        resultText = STATE.gameState.status
    }

    // the board
    for (let i = 0; i < STATE.gameState.board.length; i++) {
        let square = document.getElementById(`square${i+1}`)

        if (STATE.gameState.board[i] !== null) {
            square.innerHTML = STATE.gameState.board[i]
            const txtColor = STATE.gameState.board[i] === 'X' ? 'text-primary' : 'text-danger'
            square.classList.add(txtColor)
        } else {
            square.innerHTML = ''
        }
    }

    // update dom
    turnDOM.innerHTML = turnText
    resultDOM.innerHTML = resultText
}

// emit events



btn.addEventListener('click', () => {
    socket.emit('chat',{
        message: message.value,
        handle: handle.value,
        game: game
    })
    message.value = ''
})

message.addEventListener('keypress', () => {
    socket.emit('typing', {
        handle: handle.value
    })
})

// Listen for events

socket.on('chat', (data) =>  {
    output.innerHTML += `<p><strong class="${data.handle === 'X' ? 'text-primary' : 'text-danger'}">${data.handle}:</strong>${data.message}</p>`
    feedback.innerHTML = ''
    
})

socket.on('typing', (data) => {
    feedback.innerHTML = `<p><em>${data.handle}</em> is typing a message...</p>`
})

socket.on('joined-game', (data) => {
    output.innerHTML += `<p><em>${data.message}</em></p>`
    visibleHandle.innerHTML = `${data.handle}:`
    handle.value = data.handle
    game = data.game
    STATE.gameState = {...data.gameState}
    gameIdentifier.innerHTML = `${data.game}:`
    
    renderGameState()
})

socket.on('participant-joined-game', (data) => {
    output.innerHTML += `<p><em>${data.message}</em></p>`
})

socket.on('notification', (data) => {
    output.innerHTML += `<p><em>${data.message}</em></p>`
})

socket.on('game-state-updated', (data) => {
    console.log(data)
    STATE.gameState = {...data.gameState}

    renderGameState()
    console.log('gameState', STATE.gameState)
})