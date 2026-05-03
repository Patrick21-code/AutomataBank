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
