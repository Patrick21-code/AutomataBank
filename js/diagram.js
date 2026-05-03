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

//create state nodes
//draw state cirles
function createStateNode(id, x, y, label, isAccept = false) {
  // Create a group to hold circle + text
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.id = `state-${id}`;
  group.classList.add('state-node');

  // Store position as data attributes (useful for drawing arrows later)
  group.setAttribute('data-x', x);
  group.setAttribute('data-y', y);

  // Create outer circle
  // the circle of the code
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', x);
  circle.setAttribute('cy', y);
  circle.setAttribute('r', 35);  // Radius = 35 pixels
  circle.classList.add('state-circle');

  // If this is an accept state (S6), add inner circle for double-circle effect
  // double circle
  if (isAccept) {
    const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerCircle.setAttribute('cx', x);
    innerCircle.setAttribute('cy', y);
    innerCircle.setAttribute('r', 30);  // Slightly smaller
    innerCircle.classList.add('state-circle-inner');
    group.appendChild(innerCircle);
  }

  // Add the outer circle
  group.appendChild(circle);

  // Create text label
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', x);
  text.setAttribute('y', y + 5);  // +5 to center vertically
  text.setAttribute('text-anchor', 'middle');  // Center horizontally
  text.classList.add('state-label');
  text.textContent = label;
  
  group.appendChild(text);

  // Add click handler (for future interactivity)
  group.addEventListener('click', () => {
    console.log(`Clicked state: ${id}`);
  });
  
  return group;
}

//create transition arrows
function createTransition(from, to, label, pathType = 'straight') {
  // Get positions of start and end states
  const fromPos = STATE_POSITIONS[from];
  const toPos = STATE_POSITIONS[to];

  if (!fromPos || !toPos) {
    console.error(`Invalid transition: ${from} -> ${to}`);
    return null;
  }

  // Create group for arrow + label
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.classList.add('transition');
  group.setAttribute('data-from', from);
  group.setAttribute('data-to', to);

  // Calculate path based on type
  let pathData;
  let labelX, labelY;
  
  if (pathType === 'straight') {
    // Straight line from A to B
    pathData = `M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`;
    // Label at midpoint
    labelX = (fromPos.x + toPos.x) / 2;
    labelY = (fromPos.y + toPos.y) / 2 - 10;  // -10 to put above line
  }
  else if (pathType === 'curve') {
    // Curved line (quadratic Bezier curve)
    // Control point is above/below the midpoint
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2;
    const controlX = midX;
    const controlY = midY - 50;  // Curve upward
    
    pathData = `M ${fromPos.x} ${fromPos.y} Q ${controlX} ${controlY} ${toPos.x} ${toPos.y}`;
    labelX = controlX;
    labelY = controlY - 10;
  }
  else if (pathType === 'arc') {
    // Semicircle arc (for return paths like S5 → S1)
    const radius = Math.abs(toPos.x - fromPos.x) / 2;
    pathData = `M ${fromPos.x} ${fromPos.y} A ${radius} ${radius} 0 0 1 ${toPos.x} ${toPos.y}`;
    labelX = (fromPos.x + toPos.x) / 2;
    labelY = fromPos.y + 30;  // Below the arc
  }
  else if (pathType === 'loop') {
    // Self-loop (arrow that curves back to same state)
    const loopSize = 40;
    pathData = `M ${fromPos.x} ${fromPos.y - 35} 
                C ${fromPos.x + loopSize} ${fromPos.y - 60}, 
                  ${fromPos.x + loopSize} ${fromPos.y - 10}, 
                  ${fromPos.x} ${fromPos.y - 35}`;
    labelX = fromPos.x + loopSize + 10;
    labelY = fromPos.y - 35;
  }
  
  // Create the path element
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#3b82f6');  // Blue
  path.setAttribute('stroke-width', '2');
  path.setAttribute('marker-end', 'url(#arrowhead)');  // Add arrowhead
  path.classList.add('transition-path');
  
  group.appendChild(path);
  
  // Create label
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', labelX);
  text.setAttribute('y', labelY);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', '#1e40af');  // Darker blue
  text.setAttribute('font-size', '12');
  text.classList.add('transition-label');
  text.textContent = label;
  
  group.appendChild(text);
  
  return group;
}


//create the complete diagram
//build the entire svg diagram
//assembles everything
function createStateDiagram() {
  // Create SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 1000 600');  // Coordinate system
  svg.id = 'state-diagram';

  // Define arrowhead marker (reusable for all arrows)
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.id = 'arrowhead';
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '10');
  marker.setAttribute('refX', '9');  // Position at end of line
  marker.setAttribute('refY', '3');
  marker.setAttribute('orient', 'auto');  // Rotate to match line angle

  // Arrowhead shape (triangle)
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', '0 0, 10 3, 0 6');
  polygon.setAttribute('fill', '#3b82f6');
  
  marker.appendChild(polygon);
  defs.appendChild(marker);
  svg.appendChild(defs);

  // Create groups for organization
  const transitionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  transitionsGroup.id = 'transitions';
  
  const statesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  statesGroup.id = 'states';
  
  // Add all transitions first (so they appear behind states)
  TRANSITIONS.forEach(trans => {
    const transitionElement = createTransition(trans.from, trans.to, trans.label, trans.path);
    if (transitionElement) {
      transitionsGroup.appendChild(transitionElement);
    }
  });

  // Add all states
  Object.keys(STATE_POSITIONS).forEach(stateId => {
    const pos = STATE_POSITIONS[stateId];
    const isAccept = (stateId === 'S7');  // Only S7 is accept state
    const stateNode = createStateNode(stateId, pos.x, pos.y, pos.label, isAccept);
    statesGroup.appendChild(stateNode);
  });
  
  // Add groups to SVG (order for layering)
  svg.appendChild(transitionsGroup);
  svg.appendChild(statesGroup);
  
  return svg;
}

//highlight current state
// current state: green glow
// other state: gray inactive

function highlightState(stateId) {
  // Remove highlight from all states
  // emsures that only one state is highlighted at a time
  const allStates = document.querySelectorAll('.state-node');
  allStates.forEach(node => {
    node.classList.remove('active');
  });

  // Add highlight to current state
  const currentState = document.getElementById(`state-${stateId}`);
  if (currentState) {
    currentState.classList.add('active');
    
    // Scroll into view if diagram is scrollable
    currentState.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

//animate transitions
//animate the arrow when transitioning
//shows the path taken through the diagram

function animateTransition(fromState, toState) {
  // Find the transition arrow
  const transition = document.querySelector(
    `.transition[data-from="${fromState}"][data-to="${toState}"]`
  );

  if (!transition) {
    console.warn(`Transition not found: ${fromState} -> ${toState}`);
    return;
  }
  // Add pulse animation class
  transition.classList.add('pulse');
  
  // Remove after animation completes
  setTimeout(() => {
    transition.classList.remove('pulse');
  }, 600);
}
