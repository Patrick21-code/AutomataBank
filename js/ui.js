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

//show/hide transaction buttons
//user can choose withdraw or balance
function showTransactionMenu(visible) {
    const menu = document.getElementById('transaction-menu')
    if (!menu) return

    menu.style.display = visible ? 'flex': 'none'

    if (visible) {
        menu.classList.add('fade-in')
        setTimeout(() => menu.classList.remove('fade-in'), 300)
    }
}

//show/hide confirm/cancel buttons
function showConfirmButtons(visible) {
    const confirmBtn = document.getElementById('btn-confirm')
    const cancelBtn = document.getElementById('btn-cancel')

    if (confirmBtn) confirmBtn.style.display = visible ? 'block' : 'none'
    if (cancelBtn) cancelBtn.style.display = visible ? 'block' : 'none'
}

function showStartButton(visible) {
    const btn = document.getElementById('btn-start')
    if (!btn) return

    btn.style.display = visible ? 'block' : 'none'

    if (visible) {
        btn.classList.add('pulse')
    } else {
        btn.classList.remove('pulse')
    }

}

function showBackButton(visible) {
    const btn = document.getElementById('btn-back')
    if (!btn) return

    btn.style.display = visible ? 'block' : 'none'
}

function showResetButton(visible) {
  const btn = document.getElementById('btn-reset');
  if (!btn) return;
  
  btn.style.display = visible ? 'block' : 'none';
  //why we use display instead of visibility?
  //display: none removes from layout, visibility: hidden
}

//flashScreen - flash the screen for feedback
//greenflash when PIN correct
//red flash when PIN wrong
//blue flash for neutral messages

function flashScreen(type) {
  const screen = document.getElementById('atm-screen');
  if (!screen) return;
  
  // Add flash class
  screen.classList.add(`flash-${type}`);
  
  // Remove after animation completes
  setTimeout(() => {
    screen.classList.remove(`flash-${type}`);
  }, 500);
}

//animateReset - show reset animation
//needed for reset button
//clears the screen and returns to idle
function animateReset() {
  const screen = document.getElementById('atm-screen');
  if (!screen) return;
  
  screen.classList.add('resetting');
  
  setTimeout(() => {
    screen.classList.remove('resetting');
  }, 800);
}

//showLoadingSpinner - show spinner during processing
//for S4 (transaction) - simulating processing time

function showLoadingSpinner(visible) {
  const spinner = document.getElementById('loading-spinner');
  if (!spinner) return;
  
  spinner.style.display = visible ? 'block' : 'none';
}

//Why use setTimeout to remove classes? (CSS animations need the class removed so they can play again next time)

//state-based UI updates
//updateUIForState - Show/hide elements based on current state
//Ensures UI always matches DFA state

function updateUIForState(state) {
  // Hide everything first
  showStartButton(false);
  showKeypad(false);
  showTransactionMenu(false);
  showConfirmButtons(false);
  showBackButton(false);
  showResetButton(false);
  showLoadingSpinner(false);

  // Now show only what's needed for this state
  switch (state) {
    case 'S0':  // Idle
      showStartButton(true);
      break;
      
    case 'S1':  // Account entry
      showKeypad(true);
      break;
      
    case 'S2':  // PIN entry
      showKeypad(true);
      // Also show submit PIN button
      break;
      
    case 'S3':  // Authenticated
      showTransactionMenu(true);
      break;
      
    case 'S4':  // Amount entry
      showKeypad(true);
      showConfirmButtons(true);
      break;
      
    case 'S5':  // Balance display
      showBackButton(true);
      showResetButton(true);
      break;
      
    case 'S6':  // Rejected
      showKeypad(true);  // For retry
      showResetButton(true);  // Or give up
      break;
      
    case 'S7':  // Done
      showResetButton(true);
      break;
      
    default:
      console.error(`Unknown state: ${state}`);
  }
}

//addTransitionToLog - add entry to the transition log
//shows the dfa's path through states

function addTransitionToLog(fromState, input, toState) {
  const log = document.getElementById('transition-log')
  if (!log) return;

  // Create a new log entry element
  // on the bottom
  const entry = document.createElement('div')
  entry.className = 'log-entry'

  //create format
  entry.innerHTML = `
    <span class="log-from">${fromState}</span>
    <span class="log-arrow">--[${input}]--></span>
    <span class="log-to">${toState}</span>
  `

  // Add to log (newest at top)
  //newest entries at top - easier to read
  log.insertBefore(entry, log.firstChild)

  // Highlight animation
  entry.classList.add('log-entry-new')
  setTimeout(() => {
    entry.classList.remove('log-entry-new')
  }, 500);
  
  // Limit log to 20 entries (prevent infinite growth)
  while (log.children.length > 20) {
    log.removeChild(log.lastChild)
  }
}

function clearTransitionLog() {
  const log = document.getElementById('transition-log');
  if (!log) return;
  
  log.innerHTML = '';
}

//initializiation
//set up the UI on page load
//called once when page loads (from app.js)

function initializeUI() {
  console.log('Initializing UI...');
  
  // Set initial UI state (should match DFA's S0)
  updateUIForState('S0');
  updateScreen('S0', 'Welcome! Press START to begin transaction.');
  
  // Set up keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Add accessibility attributes
  setupAccessibility();
  
  console.log('UI initialized successfully');
}

//setup keyboard shortcuts
/*
 Shortcuts:
 0-9: Enter digit
 Enter: Submit PIN / Confirm
 Escape: Cancel
 S: Start transaction
 R: Reset
*/

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    // Don't interfere if user is typing in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }
    
    // Number keys (0-9)
    if (event.key >= '0' && event.key <= '9') {
      const digitBtn = document.getElementById(`btn-digit-${event.key}`);
      if (digitBtn && digitBtn.style.display !== 'none') {
        digitBtn.click();
      }
    }
    
    // Enter key
    if (event.key === 'Enter') {
      const submitBtn = document.getElementById('btn-submit-pin');
      const confirmBtn = document.getElementById('btn-confirm');
      
      if (submitBtn && submitBtn.style.display !== 'none') {
        submitBtn.click();
      } else if (confirmBtn && confirmBtn.style.display !== 'none') {
        confirmBtn.click();
      }
    }
    
    // Escape key
    if (event.key === 'Escape') {
      const cancelBtn = document.getElementById('btn-cancel');
      if (cancelBtn && cancelBtn.style.display !== 'none') {
        cancelBtn.click();
      }
    }
    
    // S key - Start transaction
    if (event.key.toLowerCase() === 's') {
      const startBtn = document.getElementById('btn-start');
      if (startBtn && startBtn.style.display !== 'none') {
        startBtn.click();
      }
    }
    
    // R key - Reset
    if (event.key.toLowerCase() === 'r') {
      const resetBtn = document.getElementById('btn-reset');
      if (resetBtn && resetBtn.style.display !== 'none') {
        resetBtn.click();
      }
    }
  });
}

//setupAccessibility - for screen readers
//for better UXX

function setupAccessibility() {
  // Add ARIA label to screen
  const screen = document.getElementById('atm-screen');
  if (screen) {
    screen.setAttribute('role', 'status');
    screen.setAttribute('aria-live', 'polite');
    screen.setAttribute('aria-atomic', 'true');
  }
  
  // Add ARIA labels to button groups
  const keypad = document.getElementById('keypad');
  if (keypad) {
    keypad.setAttribute('role', 'group');
    keypad.setAttribute('aria-label', 'Numeric keypad');
  }
  
  const transactionMenu = document.getElementById('transaction-menu');
  if (transactionMenu) {
    transactionMenu.setAttribute('role', 'menu');
    transactionMenu.setAttribute('aria-label', 'Transaction options');
  }
}


