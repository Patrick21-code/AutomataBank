//visualize the DFA in real-time

//as user interact with the ATM, the diagram highlights the current
//state and animates transitions

//svg since it scales perfectly (no pixelation) and easy to animate with css


//DEFINE STATE POSITIONS
/*
Coordinates:
 x: horizontal position (0 = left, 1000 = right)
 y: vertical position (0 = top, 600 = bottom)

 Layout (8 states):
 S0 at far left (start state)
 S1-S3 in top row (authentication path)
 S4 in middle row (amount entry)
 S5 in middle row (balance display)
 S6 below (error path)
 S7 at far right (accept state)
*/

const STATE_POSITIONS = {
  S0: { x: 100, y: 200, label: 'S0\nIdle' },
  S1: { x: 250, y: 200, label: 'S1\nAccount' },
  S2: { x: 400, y: 200, label: 'S2\nPIN' },
  S3: { x: 550, y: 200, label: 'S3\nAuth' },
  S4: { x: 700, y: 350, label: 'S4\nAmount' },
  S5: { x: 550, y: 350, label: 'S5\nBalance' },
  S6: { x: 250, y: 450, label: 'S6\nReject' },
  S7: { x: 900, y: 200, label: 'S7\nDone' }
};

//TRANSITIONS - define all arrows between states
/*
 Path types:
 straight': Direct line from A to B
 curve': Curved line (for self-loops or avoiding overlaps)
 arc': Semicircle (for return paths like S6 → S1)
 loop': Self-loop (arrow curves back to same state)
*/

const TRANSITIONS = [
  // Start
  { from: 'S0', to: 'S1', label: 'start', path: 'straight' },
  
  // Self-loops
  { from: 'S1', to: 'S1', label: 'digit', path: 'loop' },  // Account entry
  { from: 'S2', to: 'S2', label: 'digit', path: 'loop' },  // PIN entry
  { from: 'S4', to: 'S4', label: 'amount', path: 'loop' }, // Amount entry
  
  // Account validation
  { from: 'S1', to: 'S2', label: 'correct', path: 'straight' },
  { from: 'S1', to: 'S6', label: 'wrong', path: 'curve' },
  
  // PIN validation
  { from: 'S2', to: 'S3', label: 'correct', path: 'straight' },
  { from: 'S2', to: 'S6', label: 'wrong', path: 'curve' },
  
  // Transaction selection
  { from: 'S3', to: 'S4', label: 'withdraw', path: 'straight' },
  { from: 'S3', to: 'S5', label: 'balance', path: 'straight' },
  
  // Amount entry and confirmation
  { from: 'S4', to: 'S7', label: 'confirm', path: 'curve' },
  { from: 'S4', to: 'S3', label: 'cancel', path: 'curve' },
  
  // Balance display
  { from: 'S5', to: 'S3', label: 'back', path: 'curve' },  // Back button!
  { from: 'S5', to: 'S0', label: 'cancel', path: 'arc' },
  
  // Retry arc (S6 back to S1)
  { from: 'S6', to: 'S1', label: 'retry', path: 'arc' },
  { from: 'S6', to: 'S0', label: 'reset', path: 'arc' },
  
  // Done state
  { from: 'S7', to: 'S0', label: 'reset', path: 'curve' },
  
  // Cancel paths
  { from: 'S3', to: 'S0', label: 'cancel', path: 'arc' }
];