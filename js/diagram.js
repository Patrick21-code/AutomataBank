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