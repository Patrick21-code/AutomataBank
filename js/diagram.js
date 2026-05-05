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
 'straight': Direct line from A to B
 'curve': Curved line (for self-loops or avoiding overlaps)
 'arc': Semicircle (for return paths like S6 → S1)
 'loop': Self-loop (arrow curves back to same state)
*/

const TRANSITIONS = [
  // Start
  { from: 'S0', to: 'S1', label: 'start', path: 'straight' },
  
  // Self-loops for input states (digit entry, backspace, clear)
  { from: 'S1', to: 'S1', label: 'digit/⌫/clear', path: 'loop' },  // Account entry
  { from: 'S2', to: 'S2', label: 'digit/⌫/clear', path: 'loop' },  // PIN entry
  { from: 'S4', to: 'S4', label: 'digit/⌫/clear', path: 'loop' }, // Amount entry
  
  // Account validation
  { from: 'S1', to: 'S2', label: 'submit (valid)', path: 'straight' },
  { from: 'S1', to: 'S6', label: 'submit (invalid)', path: 'curve' },
  { from: 'S1', to: 'S0', label: 'cancel', path: 'curve' },
  
  // PIN validation
  { from: 'S2', to: 'S3', label: 'submit (correct)', path: 'straight' },
  { from: 'S2', to: 'S6', label: 'submit (wrong)', path: 'curve' },
  { from: 'S2', to: 'S0', label: 'cancel', path: 'arc' },
  
  // Transaction selection
  { from: 'S3', to: 'S4', label: 'withdraw', path: 'straight' },
  { from: 'S3', to: 'S5', label: 'balance', path: 'straight' },
  
  // Amount entry and confirmation
  { from: 'S4', to: 'S7', label: 'confirm', path: 'curve' },
  { from: 'S4', to: 'S3', label: 'back', path: 'curve' },
  { from: 'S4', to: 'S0', label: 'cancel', path: 'arc' },
  { from: 'S4', to: 'S6', label: 'insufficient', path: 'curve' },
  
  // Balance display
  { from: 'S5', to: 'S3', label: 'back', path: 'curve' },
  { from: 'S5', to: 'S7', label: 'finish', path: 'curve' },
  
  // Retry paths from rejected state
  { from: 'S6', to: 'S1', label: 'retry account', path: 'curve' },
  { from: 'S6', to: 'S2', label: 'retry PIN', path: 'arc' },
  { from: 'S6', to: 'S0', label: 'cancel/reset', path: 'arc' },
  
  // Done state
  { from: 'S7', to: 'S0', label: 'reset', path: 'curve' }
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

  // Helper function to calculate point on circle edge
  const STATE_RADIUS = 35;
  function getCircleEdgePoint(fromX, fromY, toX, toY, isStart = false) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return { x: fromX, y: fromY };
    
    const ratio = STATE_RADIUS / distance;
    if (isStart) {
      return {
        x: fromX + dx * ratio,
        y: fromY + dy * ratio
      };
    } else {
      return {
        x: toX - dx * ratio,
        y: toY - dy * ratio
      };
    }
  }

  // Calculate path based on type
  let pathData;
  let labelX, labelY;
  
  if (pathType === 'straight') {
    // Calculate edge points to avoid overlapping circles
    const startPoint = getCircleEdgePoint(fromPos.x, fromPos.y, toPos.x, toPos.y, true);
    const endPoint = getCircleEdgePoint(fromPos.x, fromPos.y, toPos.x, toPos.y, false);
    
    // Straight line from edge to edge
    pathData = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
    
    // Label at midpoint with custom offsets for specific transitions
    labelX = (fromPos.x + toPos.x) / 2;
    labelY = (fromPos.y + toPos.y) / 2 - 10;  // Default: above line
    
    // Custom label positions for straight paths
    if (from === 'S0' && to === 'S1') {
      // S0 → S1 start
      labelY = labelY - 5;
    } else if (from === 'S1' && to === 'S2') {
      // S1 → S2 submit
      labelY = labelY - 5;
    } else if (from === 'S2' && to === 'S3') {
      // S2 → S3 correct
      labelY = labelY - 5;
    } else if (from === 'S3' && to === 'S4') {
      // S3 → S4 withdraw: shift down and right
      labelX = labelX + 20;
      labelY = labelY + 30;
    } else if (from === 'S3' && to === 'S5') {
      // S3 → S5 balance: shift down and left
      labelX = labelX - 20;
      labelY = labelY + 30;
    }
  }
  else if (pathType === 'curve') {
    // Curved line (quadratic Bezier curve)
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2;
    let controlX = midX;
    let controlY = midY - 50;  // Default: curve upward
    
    // Custom control points for specific transitions to avoid overlaps
    if (from === 'S1' && to === 'S0') {
      // S1 → S0 cancel: curve below
      controlY = midY + 60;
      labelX = controlX;
      labelY = controlY + 20;
    } else if (from === 'S1' && to === 'S6') {
      // S1 → S6 invalid account: curve down and slightly right
      controlX = midX + 20;
      controlY = midY + 30;
      labelX = controlX + 25;
      labelY = controlY + 10;
    } else if (from === 'S2' && to === 'S6') {
      // S2 → S6 wrong PIN: curve left
      controlX = midX - 60;
      controlY = midY;
      labelX = controlX - 20;
      labelY = controlY + 5;
    } else if (from === 'S4' && to === 'S7') {
      // S4 → S7 confirm: curve up to avoid S3
      controlY = midY - 80;
      labelX = controlX + 10;
      labelY = controlY - 5;
    } else if (from === 'S4' && to === 'S3') {
      // S4 → S3 cancel: curve down
      controlY = midY + 40;
      labelX = controlX;
      labelY = controlY + 20;
    } else if (from === 'S4' && to === 'S6') {
      // S4 → S6 insufficient funds: curve left and down
      controlX = midX - 80;
      controlY = midY + 20;
      labelX = controlX - 30;
      labelY = controlY + 10;
    } else if (from === 'S5' && to === 'S3') {
      // S5 → S3 back: curve down
      controlY = midY + 40;
      labelX = controlX;
      labelY = controlY + 20;
    } else if (from === 'S5' && to === 'S7') {
      // S5 → S7 finish: curve up and right
      controlX = midX + 80;
      controlY = midY - 60;
      labelX = controlX + 20;
      labelY = controlY;
    } else if (from === 'S6' && to === 'S1') {
      // S6 → S1 new account: curve left
      controlX = midX - 40;
      controlY = midY - 20;
      labelX = controlX - 35;
      labelY = controlY;
    } else if (from === 'S7' && to === 'S0') {
      // S7 → S0 reset: curve up high
      controlY = fromPos.y - 100;
      labelX = controlX;
      labelY = controlY - 10;
    }
    
    // Calculate approximate end point on circle edge for curves
    // For Bezier curves, approximate the tangent at the end
    const t = 0.95; // Use 95% of the curve to approximate direction
    const approxEndX = (1-t)*(1-t)*fromPos.x + 2*(1-t)*t*controlX + t*t*toPos.x;
    const approxEndY = (1-t)*(1-t)*fromPos.y + 2*(1-t)*t*controlY + t*t*toPos.y;
    const endPoint = getCircleEdgePoint(approxEndX, approxEndY, toPos.x, toPos.y, false);
    
    // Similar for start point
    const t2 = 0.05;
    const approxStartX = (1-t2)*(1-t2)*fromPos.x + 2*(1-t2)*t2*controlX + t2*t2*toPos.x;
    const approxStartY = (1-t2)*(1-t2)*fromPos.y + 2*(1-t2)*t2*controlY + t2*t2*toPos.y;
    const startPoint = getCircleEdgePoint(fromPos.x, fromPos.y, approxStartX, approxStartY, true);
    
    pathData = `M ${startPoint.x} ${startPoint.y} Q ${controlX} ${controlY} ${endPoint.x} ${endPoint.y}`;
    
    // Set default label position if not customized above
    if (!labelX) labelX = controlX;
    if (!labelY) labelY = controlY - 10;
  }
  else if (pathType === 'arc') {
    // Semicircle arc (for return paths)
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const radius = Math.sqrt(dx * dx + dy * dy) / 2;
    
    // Determine sweep direction based on specific transitions
    let sweepFlag = 1;  // Default: clockwise
    let labelOffset = 30;
    let labelXOffset = 0;
    
    if (from === 'S2' && to === 'S0') {
      // S2 → S0 cancel: arc above
      sweepFlag = 0;  // Counter-clockwise
      labelOffset = -35;
      labelXOffset = 0;
    } else if (from === 'S6' && to === 'S2') {
      // S6 → S2 retry: arc right
      sweepFlag = 0;  // Counter-clockwise
      labelOffset = -25;
      labelXOffset = 10;
    } else if (from === 'S6' && to === 'S0') {
      // S6 → S0 reset: arc below
      sweepFlag = 1;  // Clockwise
      labelOffset = 70;
      labelXOffset = -20;
    } else if (from === 'S4' && to === 'S0') {
      // S4 → S0 cancel: arc way below to avoid other paths
      sweepFlag = 1;  // Clockwise
      labelOffset = 100;
      labelXOffset = -100;
    }
    
    // Calculate start and end points on circle edges for arcs
    // For arcs, we need to calculate the tangent direction at start and end
    const angle = Math.atan2(dy, dx);
    const perpAngle = angle + (sweepFlag === 0 ? Math.PI / 2 : -Math.PI / 2);
    
    const startX = fromPos.x + STATE_RADIUS * Math.cos(perpAngle);
    const startY = fromPos.y + STATE_RADIUS * Math.sin(perpAngle);
    const endX = toPos.x - STATE_RADIUS * Math.cos(perpAngle);
    const endY = toPos.y - STATE_RADIUS * Math.sin(perpAngle);
    
    pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 0 ${sweepFlag} ${endX} ${endY}`;
    labelX = (fromPos.x + toPos.x) / 2 + labelXOffset;
    labelY = (fromPos.y + toPos.y) / 2 + labelOffset;
  }
  else if (pathType === 'loop') {
    // Self-loop (arrow that curves back to same state)
    const loopSize = 50;
    
    // Calculate start point on the circle edge (top-right)
    const angle1 = -Math.PI / 4; // -45 degrees (top-right)
    const startX = fromPos.x + STATE_RADIUS * Math.cos(angle1);
    const startY = fromPos.y + STATE_RADIUS * Math.sin(angle1);
    
    // Calculate end point on the circle edge (top-left)
    const angle2 = -3 * Math.PI / 4; // -135 degrees (top-left)
    const endX = fromPos.x + STATE_RADIUS * Math.cos(angle2);
    const endY = fromPos.y + STATE_RADIUS * Math.sin(angle2);
    
    // Control points for a nice loop above the state
    const control1X = fromPos.x + loopSize;
    const control1Y = fromPos.y - loopSize - 20;
    const control2X = fromPos.x - loopSize;
    const control2Y = fromPos.y - loopSize - 20;
    
    pathData = `M ${startX} ${startY} 
                C ${control1X} ${control1Y}, 
                  ${control2X} ${control2Y}, 
                  ${endX} ${endY}`;
    
    labelX = fromPos.x;
    labelY = fromPos.y - loopSize - 30;
  }
  
  // Create the path element
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#3b82f6');  // Blue
  path.setAttribute('stroke-width', '2');
  path.setAttribute('marker-end', 'url(#arrowhead)');  // Add arrowhead
  path.classList.add('transition-path');
  
  console.log(`Created transition ${from} → ${to} with arrowhead`);
  
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
  
  // Main arrowhead marker
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.id = 'arrowhead';
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '10');
  marker.setAttribute('refY', '5');
  marker.setAttribute('markerWidth', '8');
  marker.setAttribute('markerHeight', '8');
  marker.setAttribute('orient', 'auto');
  marker.setAttribute('markerUnits', 'strokeWidth');

  // Arrowhead shape (triangle)
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', '0 0, 10 5, 0 10');
  polygon.setAttribute('fill', '#3b82f6');
  
  marker.appendChild(polygon);
  defs.appendChild(marker);
  svg.appendChild(defs);
  
  console.log('✓ Arrowhead marker created with viewBox');

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

// Map state values to state IDs for diagram
const STATE_VALUE_TO_ID = {
  'idle': 'S0',
  'account_entry': 'S1',
  'pin_entry': 'S2',
  'authenticated': 'S3',
  'amount_entry': 'S4',
  'balance_display': 'S5',
  'rejected': 'S6',
  'done': 'S7'
};

function highlightState(stateValue) {
  // Convert state value to state ID for diagram
  const stateId = STATE_VALUE_TO_ID[stateValue] || stateValue;
  
  console.log(`🎯 Highlighting state: ${stateValue} → ${stateId}`);
  
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
    console.log(`✓ State ${stateId} highlighted successfully`);
    
    // Scroll into view if diagram is scrollable
    currentState.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    console.error(`❌ State element not found: state-${stateId}`);
  }
}

//animate transitions
//animate the arrow when transitioning
//shows the path taken through the diagram

function animateTransition(fromStateValue, toStateValue) {
  // Convert state values to state IDs for diagram
  const fromState = STATE_VALUE_TO_ID[fromStateValue] || fromStateValue;
  const toState = STATE_VALUE_TO_ID[toStateValue] || toStateValue;
  
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

//toggle diagram panel (no longer needed, kept for compatibility)
function toggleDiagram(visible) {
  // This function is kept for backward compatibility
  // Panel is now controlled by hamburger button in app.js
  console.log('toggleDiagram called:', visible);
}

//initialization
//set up the diagram on page load
function initializeDiagram() {
  console.log('Initializing state diagram...');
  
  // Find the container
  const container = document.getElementById('diagram-container');
  if (!container) {
    console.error('Diagram container not found!');
    return;
  }

  // Create and insert the diagram
  const diagram = createStateDiagram();
  container.appendChild(diagram);
  
  // Highlight initial state
  highlightState('S0');
  
  console.log('Diagram initialized successfully');
}