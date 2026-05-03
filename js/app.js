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