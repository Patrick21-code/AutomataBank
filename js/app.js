//glue that connects all the components together
/*
    Initializes everything on page load
    Handles button clicks
    Coordinates between DFA, UI, and diagram
    Manages application state
*/


//global state
//dfa instance needs to be accessible from all event handlers
//keeps state consistent across the applicatioin

// The DFA instance (initialized in initializeApp)
let atmDFA = null;

// Track if we're in the middle of an animation
// Prevent user from clicking buttons during animations
let isAnimating = false;

// Track if diagram is initialized
let diagramInitialized = false;

//processTransition - send input to dfa and upadte all ui
function processTransition(input) {
  // Prevent multiple transitions at once
  if (isAnimating) {
    console.log('Animation in progress, please wait...');
    return;
  }
// Safety check
  if (!atmDFA) {
    console.error('DFA not initialized!');
    return;
  }
  
  // Mark as animating
  isAnimating = true;
  
  // Get current state before transition
  const fromState = atmDFA.currentState;
  
  // Execute transition in DFA
  const result = atmDFA.transition(input);
  
  // Update screen with message
  updateScreen(result.toState, result.message);
  
  // Update button visibility based on new state
  updateUIForState(result.toState);
  
  // Update diagram (if initialized)
  if (diagramInitialized) {
    highlightState(result.toState);
    animateTransition(fromState, result.toState);
  }
  
  // Add to transition log
  addTransitionToLog(fromState, input, result.toState);
  
  // Handle any special actions
  handleAction(result.action);
  
  // Allow next transition after animation completes
  setTimeout(() => {
    isAnimating = false;
  }, 300);
}

//handleAction - handle special actions from DFA
//just makes the UI better
function handleAction(action) {
  if (!action) return;
  
  switch (action) {
    case 'show_keypad':
      showKeypad(true);
      break;
      
    case 'show_transaction_menu':
      showTransactionMenu(true);
      break;
      
    case 'show_confirm_button':
      showConfirmButtons(true);
      break;
      
    case 'reset_atm':
      animateReset();
      break;
      
    case 'block_card':
      flashScreen('error');
      // Could add sound effect here
      break;
      
    case 'complete_transaction':
      flashScreen('success');
      // Could add sound effect here
      break;
      
    case 'auto_submit':
      // Auto-submit PIN after 4 digits
      setTimeout(() => {
        handleSubmitPin();
      }, 300);
      break;
      
    default:
      // Unknown action - just log it
      console.log(`Unknown action: ${action}`);
  }
}

//handleDigitPress
function handleDigitPress(digit) {
  console.log(`Digit pressed: ${digit}`);
  
  // Determine which buffer to update based on current state
  const state = atmDFA.currentState;
  
  if (state === STATES.S1) {
    // Account entry - show in plain text
    atmDFA.accountBuffer += digit;
    updateScreen(atmDFA.currentState, `Account: ${atmDFA.accountBuffer}`);
  } 
  else if (state === STATES.S2) {
    // PIN entry
    atmDFA.pinBuffer += digit;
    updatePinDisplay(atmDFA.pinBuffer.length);
  }
  else if (state === STATES.S4) {
    // Amount entry
    atmDFA.amountBuffer += digit;
    updateAmountDisplay(atmDFA.amountBuffer);
  }
  
  // Process the transition
  processTransition(INPUTS.ENTER_DIGIT);
}