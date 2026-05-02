//view layer
//takes the dfa's state and turns it into a visual ATM interface

//update screen - display message on the ATM screen
//centralizes all screen updates in one place

function updateScreen(state, message) {
    //get screen element
    const screen = document.getElementById('atm-screen')

    //make sure element exists
    if (!screen) {
        console.error('ATM screen element not found!')
        return
    }

    //update the text
    screen.textContent = message

    //remove all previous state classes so that we can add the new one without conflicts
    screen.className = 'atm-screen'

    //add state-specific class for styling (colors/effects per state)
    screen.classList.add(`state-${state}`)

    //add animation class 
    screen.classList.add('screen-update')

    //remove animation class after .3 seconds
    setTimeout(() => {
        screen.classList.remove('screen-update')
    }, 300)
}

//displayPinMask - show pin as dots for security
function displayPinMask(length) {
    const mask = '•'.repeat(length)

    return `PIN: ${mask}`
}