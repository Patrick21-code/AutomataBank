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

//updatePinDisplay - update screen with masked PIN
//modifies the DOM unlike displayPinMask which just returns a string
function updatePinDisplay(length) {
    const screen = document.getElementById('atm-screen')
    if (!screen) return

    const maskedPin = displayPinMask(length)

    screen.textContent = maskedPin

    //add typing animation
    screen.classList.add('typing')
    setTimeout(() => screen.classList.remove('typing'), 100)
}

//displayAmountMask - for better UX
function displayAmountMask(amount) {
    if (!amount || amount === '') {
        return '$Enter amount: $ ___'
    }
    return `Enter amount: $${amount}`
}

//updateAmountDisplay - update screen with amount
function updateAmountDisplay(amount) {
    const screen = document.getElementById('atm-screen')
    if (!screen) return

    const formattedAmount = displayAmountMask(amount)
    screen.textContent = formattedAmount

    screen.classList.add('typing')
    setTimeout(() => screen.classList.remove('typing'), 100)
}

//control button visibility
//other states doesn't need the button
function showKeypad(visible) {
    const keypad = document.getElementById('keypad')
    if (!keypad) return

    //none removes it from the layout
    keypad.style.display = visible ? 'grid' : 'none'

    //add fade-in animation when showing
    if (visible) {
        keypad.classList.add('fade-in')
        setTimeout(() => keypad.classList.remove('fade-in'), 300)
    }
}

