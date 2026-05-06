//glue that connects all the components together
/*
    Initializes everything on page load
    Handles button clicks
    Coordinates between DFA, UI, and diagram
    Manages application state
*/


//global state
//dfa instance needs to be accessible from all event handlers
//keeps state consistent across the application

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

//handleStart - User clicks the Start button
function handleStart() {
  console.log('Start button clicked');
  processTransition(INPUTS.START);
}

//handleDigitPress
function handleDigitPress(digit) {
  console.log(`Digit pressed: ${digit}`);
  
  // Determine which buffer to update based on current state
  const state = atmDFA.currentState;
  
  if (state === 'account_entry') {
    // Account entry - show in plain text
    atmDFA.accountBuffer += digit;
    updateScreen(atmDFA.currentState, `Account: ${atmDFA.accountBuffer}`);
  } 
  else if (state === 'pin_entry') {
    // PIN entry
    atmDFA.pinBuffer += digit;
    updatePinDisplay(atmDFA.pinBuffer.length);
  }
  else if (state === 'amount_entry') {
    // Amount entry
    atmDFA.amountBuffer += digit;
    updateAmountDisplay(atmDFA.amountBuffer);
  }
  
  // Process the transition
  processTransition(INPUTS.ENTER_DIGIT);
}

//handleSubmitAccount
function handleSubmitAccount() {
  console.log('Submit account clicked');
  
  // Process the transition (DFA will validate account internally)
  processTransition(INPUTS.SUBMIT_ACCOUNT);
}

//handleSubmitPin
function handleSubmitPin() {
  console.log('Submit PIN clicked');
  
  // Always process the transition - let the DFA handle validation
  // This ensures S6 gets highlighted for invalid PIN lengths
  processTransition(INPUTS.SUBMIT_PIN);
}

/**
 * handleSelectWithdraw - User chooses to withdraw money
 */
function handleSelectWithdraw() {
  console.log('Withdraw selected');
  processTransition(INPUTS.SELECT_WITHDRAW);
}

/**
 * handleSelectBalance - User chooses to check balance
 */
function handleSelectBalance() {
  console.log('Balance selected');
  processTransition(INPUTS.SELECT_BALANCE);
}

/**
 * handleBack - User clicks back button from balance display
 */
function handleBack() {
  console.log('Back clicked');
  processTransition(INPUTS.BACK);
}

/**
 * handleEnterAmount - User enters withdrawal amount digit
 * 
 * @param {string} digit - The digit pressed
 */
function handleEnterAmount(digit) {
  console.log(`Amount digit entered: ${digit}`);
  atmDFA.amountBuffer += digit;
  updateAmountDisplay(atmDFA.amountBuffer);
  processTransition(INPUTS.ENTER_AMOUNT);
}

/**
 * handleConfirm - User confirms transaction
 */
function handleConfirm() {
  console.log('Confirm clicked');
  processTransition(INPUTS.CONFIRM);
}

/**
 * handleClear - User clicks clear button to clear current input buffer
 */
function handleClear() {
  console.log('Clear clicked');
  processTransition(INPUTS.CLEAR);
}

/**
 * handleBackspace - User clicks backspace button to delete last digit
 */
function handleBackspace() {
  console.log('Backspace clicked');
  
  // Just process the transition - the DFA will handle buffer modification
  processTransition(INPUTS.BACKSPACE);
}

/**
 * handleCancel - User cancels transaction
 */
function handleCancel() {
  console.log('Cancel clicked');
  processTransition(INPUTS.CANCEL);
}

/**
 * handleReset - User resets the ATM
 */
function handleReset() {
  console.log('Reset clicked');
  processTransition(INPUTS.RESET);
}

/**
 * handleRetry - User retries after wrong account/PIN
 */
function handleRetry() {
  console.log('Retry clicked');
  
  // Clear all buffers
  atmDFA.accountBuffer = '';
  atmDFA.pinBuffer = '';
  atmDFA.amountBuffer = '';
  
  // Process transition (back to S1)
  processTransition(INPUTS.ENTER_DIGIT);
}

//Setup Event Listeners
//attach handlers to all buttons
function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Start button
  const btnStart = document.getElementById('btn-start');
  if (btnStart) {
    btnStart.addEventListener('click', handleStart);
  }
  
  // Digit buttons (0-9)
  for (let i = 0; i <= 9; i++) {
    const btnDigit = document.getElementById(`btn-digit-${i}`);
    if (btnDigit) {
      // Use closure to capture the digit value
      btnDigit.addEventListener('click', () => handleDigitPress(i.toString()));
    }
  }
  
  // Clear button
  const btnClear = document.getElementById('btn-clear');
  if (btnClear) {
    btnClear.addEventListener('click', handleClear);
  }
  
  // Backspace button
  const btnBackspace = document.getElementById('btn-backspace');
  if (btnBackspace) {
    btnBackspace.addEventListener('click', handleBackspace);
  }
  
  // Cancel button on keypad
  const btnCancelKeypad = document.getElementById('btn-cancel-keypad');
  if (btnCancelKeypad) {
    btnCancelKeypad.addEventListener('click', handleCancel);
  }
  
  // Submit account button
  const btnSubmitAccount = document.getElementById('btn-submit-account');
  if (btnSubmitAccount) {
    btnSubmitAccount.addEventListener('click', handleSubmitAccount);
  }
  
  // Submit PIN button
  const btnSubmit = document.getElementById('btn-submit-pin');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', handleSubmitPin);
  }
  
  // Submit amount button
  const btnSubmitAmount = document.getElementById('btn-submit-amount');
  if (btnSubmitAmount) {
    btnSubmitAmount.addEventListener('click', handleConfirm);
  }
  
  // Transaction buttons
  const btnWithdraw = document.getElementById('btn-withdraw');
  if (btnWithdraw) {
    btnWithdraw.addEventListener('click', handleSelectWithdraw);
  }
  
  const btnBalance = document.getElementById('btn-balance');
  if (btnBalance) {
    btnBalance.addEventListener('click', handleSelectBalance);
  }
  
  // Back button
  const btnBack = document.getElementById('btn-back');
  if (btnBack) {
    btnBack.addEventListener('click', handleBack);
  }
  
  // Done button (for balance display)
  const btnDone = document.getElementById('btn-done');
  if (btnDone) {
    btnDone.addEventListener('click', handleConfirm);
  }
  
  // Confirm/Cancel buttons
  const btnConfirm = document.getElementById('btn-confirm');
  if (btnConfirm) {
    btnConfirm.addEventListener('click', handleConfirm);
  }
  
  const btnCancel = document.getElementById('btn-cancel');
  if (btnCancel) {
    btnCancel.addEventListener('click', handleCancel);
  }
  
  // Reset button
  const btnReset = document.getElementById('btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', handleReset);
  }
  
  // Retry button (appears after wrong account/PIN)
  const btnRetry = document.getElementById('btn-retry');
  if (btnRetry) {
    btnRetry.addEventListener('click', handleRetry);
  }
  
  // Clear log button
  const btnClearLog = document.getElementById('btn-clear-log');
  if (btnClearLog) {
    btnClearLog.addEventListener('click', () => {
      clearTransitionLog();
      console.log('Transition log cleared');
    });
  }
  
  // Diagram panel toggle
  const diagramToggleBtn = document.getElementById('diagram-toggle-btn');
  const diagramPanel = document.getElementById('diagram-panel');
  const diagramOverlay = document.getElementById('diagram-overlay');
  const btnClosePanel = document.getElementById('btn-close-panel');
  
  function openDiagramPanel() {
    if (diagramPanel) diagramPanel.classList.add('open');
    if (diagramToggleBtn) diagramToggleBtn.classList.add('open');
  }
  
  function closeDiagramPanel() {
    if (diagramPanel) diagramPanel.classList.remove('open');
    if (diagramToggleBtn) diagramToggleBtn.classList.remove('open');
  }
  
  if (diagramToggleBtn) {
    diagramToggleBtn.addEventListener('click', () => {
      const isOpen = diagramPanel && diagramPanel.classList.contains('open');
      if (isOpen) {
        closeDiagramPanel();
      } else {
        openDiagramPanel();
      }
    });
  }
  
  if (btnClosePanel) {
    btnClosePanel.addEventListener('click', closeDiagramPanel);
  }
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && diagramPanel && diagramPanel.classList.contains('open')) {
      closeDiagramPanel();
    }
  });
}

//initialization
function initializeApp() {
  console.log('=== Initializing ATM DFA Simulator ===');
  
  try {
    // Step 1: Create DFA instance
    console.log('Creating DFA instance...');
    atmDFA = new ATM_DFA();
    console.log('✓ DFA created');
    
    // Step 2: Initialize UI
    console.log('Initializing UI...');
    initializeUI();
    console.log('✓ UI initialized');
    
    // Step 3: Initialize diagram (if container exists)
    const diagramContainer = document.getElementById('diagram-container');
    if (diagramContainer) {
      console.log('Initializing state diagram...');
      initializeDiagram();
      diagramInitialized = true;
      console.log('✓ Diagram initialized');
    } else {
      console.warn('Diagram container not found - skipping diagram');
    }
    
    // Step 4: Initialize string tester (if container exists)
    const testerContainer = document.getElementById('tester-container');
    if (testerContainer) {
      console.log('Initializing string tester...');
      initializeTester();
      console.log('✓ Tester initialized');
    } else {
      console.warn('Tester container not found - skipping tester');
    }
    
    // Step 5: Set up event listeners
    console.log('Setting up event listeners...');
    setupEventListeners();
    console.log('✓ Event listeners set up');
    
    // Step 6: Display welcome message
    updateScreen('idle', 'Welcome! Please press START to begin.');
    
    console.log('=== Initialization complete ===');
    console.log('Current state:', atmDFA.currentState);
    
  } catch (error) {
    console.error('Initialization failed:', error);
    alert('Failed to initialize application. Please check the console for errors.');
  }
}

//utility functions

//resert the ATM to initial state
function resetATM() {
  console.log('Resetting ATM...');
  
  // Reset DFA
  atmDFA.reset();
  
  // Reset UI
  updateUIForState('idle');
  updateScreen('idle', 'Welcome! Please press START to begin.');
  
  // Reset diagram
  if (diagramInitialized) {
    highlightState('S0');
  }
  
  // Clear log
  clearTransitionLog();
  
  console.log('ATM reset complete');
}

//FOR DEBUGGING
function getSystemInfo() {
  return {
    currentState: atmDFA.currentState,
    stateDescription: atmDFA.getStateDescription(),
    accountBuffer: atmDFA.accountBuffer ? '(entered)' : '(empty)',
    pinBuffer: '•'.repeat(atmDFA.pinBuffer.length),  // Masked
    balance: atmDFA.getBalance(),
    transactionHistory: atmDFA.getTransitionHistory(),
    isInAcceptState: atmDFA.isInAcceptState()
  };
}

function enableDebugMode() {
  console.log('Debug mode enabled');
  
  // Log every transition
  const originalProcessTransition = processTransition;
  processTransition = function(input) {
    console.log('=== TRANSITION ===');
    console.log('Input:', input);
    console.log('Before:', getSystemInfo());
    
    originalProcessTransition(input);
    
    console.log('After:', getSystemInfo());
    console.log('==================');
  };
  
  // Make functions globally accessible
  window.atmDFA = atmDFA;
  window.getSystemInfo = getSystemInfo;
  window.resetATM = resetATM;
  
  console.log('Debug functions available:');
  console.log('- atmDFA: Access the DFA instance');
  console.log('- getSystemInfo(): Get current state info');
  console.log('- resetATM(): Reset to initial state');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM already loaded
  initializeApp();
}

