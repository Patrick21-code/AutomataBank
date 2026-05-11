// ATM DFA State Diagram - Real-time Visualizer
// Highlights current state and animates transitions

// DEFINE STATE POSITIONS
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

// TRANSITIONS
const TRANSITIONS = [
  // Start
  { from: 'S0', to: 'S1', label: 'start', path: 'straight' },

  // Self-loops
  { from: 'S1', to: 'S1', label: 'digit/⌫/clear', path: 'loop' },
  { from: 'S2', to: 'S2', label: 'digit/⌫/clear', path: 'loop' },
  { from: 'S4', to: 'S4', label: 'digit/⌫/clear', path: 'loop' },

  // Account validation
  { from: 'S1', to: 'S2', label: 'submit (valid)', path: 'straight' },
  { from: 'S1', to: 'S6', label: 'submit (invalid)', path: 'curve' },
  { from: 'S1', to: 'S0', label: 'cancel', path: 'curve' },

  // PIN validation
  { from: 'S2', to: 'S3', label: 'submit (correct)', path: 'straight' },
  { from: 'S2', to: 'S6', label: 'submit (wrong)', path: 'curve' },
  // FIXED: was 'arc', now 'curve' so arrowhead renders correctly
  { from: 'S2', to: 'S0', label: 'cancel', path: 'curve' },

  // Transaction selection
  { from: 'S3', to: 'S4', label: 'withdraw', path: 'straight' },
  { from: 'S3', to: 'S5', label: 'balance', path: 'straight' },

  // Amount entry and confirmation
  { from: 'S4', to: 'S7', label: 'confirm', path: 'curve' },
  { from: 'S4', to: 'S3', label: 'back', path: 'curve' },
  // FIXED: was 'arc', now 'curve'
  { from: 'S4', to: 'S0', label: 'cancel', path: 'curve' },
  { from: 'S4', to: 'S6', label: 'insufficient', path: 'curve' },

  // Balance display
  { from: 'S5', to: 'S3', label: 'back', path: 'curve' },
  { from: 'S5', to: 'S7', label: 'finish', path: 'curve' },

  // Retry paths from rejected state
  { from: 'S6', to: 'S1', label: 'retry account', path: 'curve' },
  // FIXED: was 'arc', now 'curve'
  { from: 'S6', to: 'S2', label: 'retry PIN', path: 'curve' },
  // FIXED: was 'arc', now 'curve'
  { from: 'S6', to: 'S4', label: 'retry amount', path: 'curve' },
  { from: 'S6', to: 'S0', label: 'cancel/reset', path: 'curve' },

  // Done state
  { from: 'S7', to: 'S0', label: 'reset', path: 'curve' }
];

// CREATE STATE NODE
function createStateNode(id, x, y, label, isAccept = false) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.id = `state-${id}`;
  group.classList.add('state-node');
  group.setAttribute('data-x', x);
  group.setAttribute('data-y', y);

  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', x);
  circle.setAttribute('cy', y);
  circle.setAttribute('r', 35);
  circle.classList.add('state-circle');

  group.appendChild(circle);

  if (isAccept) {
    const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerCircle.setAttribute('cx', x);
    innerCircle.setAttribute('cy', y);
    innerCircle.setAttribute('r', 30);
    innerCircle.classList.add('state-circle-inner');
    group.appendChild(innerCircle);
  }

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', x);
  text.setAttribute('y', y + 5);
  text.setAttribute('text-anchor', 'middle');
  text.classList.add('state-label');
  text.textContent = label;

  group.appendChild(text);

  group.addEventListener('click', () => {
    console.log(`Clicked state: ${id}`);
  });

  return group;
}

// CREATE TRANSITION ARROW
function createTransition(from, to, label, pathType = 'straight') {
  const fromPos = STATE_POSITIONS[from];
  const toPos = STATE_POSITIONS[to];

  if (!fromPos || !toPos) {
    console.error(`Invalid transition: ${from} -> ${to}`);
    return null;
  }

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.classList.add('transition');
  group.setAttribute('data-from', from);
  group.setAttribute('data-to', to);

  const STATE_RADIUS = 35;

  function getCircleEdgePoint(fromX, fromY, toX, toY, isStart = false) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return { x: fromX, y: fromY };
    const ratio = STATE_RADIUS / distance;
    if (isStart) {
      return { x: fromX + dx * ratio, y: fromY + dy * ratio };
    } else {
      return { x: toX - dx * ratio, y: toY - dy * ratio };
    }
  }

  let pathData;
  let labelX, labelY;

  if (pathType === 'straight') {
    const startPoint = getCircleEdgePoint(fromPos.x, fromPos.y, toPos.x, toPos.y, true);
    const endPoint = getCircleEdgePoint(fromPos.x, fromPos.y, toPos.x, toPos.y, false);
    pathData = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;

    labelX = (fromPos.x + toPos.x) / 2;
    labelY = (fromPos.y + toPos.y) / 2 - 10;

    if (from === 'S0' && to === 'S1') {
      labelY = labelY - 5;
    } else if (from === 'S1' && to === 'S2') {
      labelY = labelY - 5;
    } else if (from === 'S2' && to === 'S3') {
      labelY = labelY - 5;
    } else if (from === 'S3' && to === 'S4') {
      labelX = labelX + 20;
      labelY = labelY + 30;
    } else if (from === 'S3' && to === 'S5') {
      labelX = labelX - 20;
      labelY = labelY + 30;
    }
  }
  else if (pathType === 'curve') {
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2;
    let controlX = midX;
    let controlY = midY - 50;

    // Custom control points for each curve transition
    if (from === 'S1' && to === 'S0') {
      controlY = midY + 60;
      labelX = controlX;
      labelY = controlY + 20;
    } else if (from === 'S1' && to === 'S6') {
      controlX = midX + 20;
      controlY = midY + 30;
      labelX = controlX + 25;
      labelY = controlY + 10;
    } else if (from === 'S2' && to === 'S6') {
      controlX = midX - 60;
      controlY = midY;
      labelX = controlX - 20;
      labelY = controlY + 5;
    } else if (from === 'S4' && to === 'S7') {
      controlY = midY - 80;
      labelX = controlX + 10;
      labelY = controlY - 5;
    } else if (from === 'S4' && to === 'S3') {
      controlY = midY + 40;
      labelX = controlX;
      labelY = controlY + 20;
    } else if (from === 'S4' && to === 'S6') {
      controlX = midX - 80;
      controlY = midY + 20;
      labelX = controlX - 30;
      labelY = controlY + 10;
    } else if (from === 'S5' && to === 'S3') {
      controlY = midY + 40;
      labelX = controlX;
      labelY = controlY + 20;
    } else if (from === 'S5' && to === 'S7') {
      controlX = midX + 80;
      controlY = midY - 60;
      labelX = controlX + 20;
      labelY = controlY;
    } else if (from === 'S6' && to === 'S1') {
      controlX = midX - 40;
      controlY = midY - 20;
      labelX = controlX - 35;
      labelY = controlY;
    } else if (from === 'S7' && to === 'S0') {
      controlY = fromPos.y - 100;
      labelX = controlX;
      labelY = controlY - 10;
    }
    // --- FIXED TRANSITIONS (formerly 'arc') ---
    else if (from === 'S2' && to === 'S0') {
      // Curve below, clearing S1
      controlX = midX;
      controlY = midY + 80;
      labelX = controlX;
      labelY = controlY + 18;
    } else if (from === 'S4' && to === 'S0') {
      // Deep arc below S6
      controlX = midX - 60;
      controlY = midY + 120;
      labelX = controlX - 20;
      labelY = controlY + 18;
    } else if (from === 'S6' && to === 'S0') {
      // Curve below and left
      controlX = midX - 40;
      controlY = midY + 60;
      labelX = controlX - 30;
      labelY = controlY + 18;
    } else if (from === 'S6' && to === 'S2') {
      // Curve up and right
      controlX = midX + 60;
      controlY = midY - 30;
      labelX = controlX + 30;
      labelY = controlY - 10;
    } else if (from === 'S6' && to === 'S4') {
      // Curve up and right to S4
      controlX = midX + 100;
      controlY = midY - 20;
      labelX = controlX + 40;
      labelY = controlY;
    }

    // Approximate end point on circle edge using tangent at t=0.95
    const t = 0.95;
    const approxEndX = (1-t)*(1-t)*fromPos.x + 2*(1-t)*t*controlX + t*t*toPos.x;
    const approxEndY = (1-t)*(1-t)*fromPos.y + 2*(1-t)*t*controlY + t*t*toPos.y;
    const endPoint = getCircleEdgePoint(approxEndX, approxEndY, toPos.x, toPos.y, false);

    // Approximate start point on circle edge using tangent at t=0.05
    const t2 = 0.05;
    const approxStartX = (1-t2)*(1-t2)*fromPos.x + 2*(1-t2)*t2*controlX + t2*t2*toPos.x;
    const approxStartY = (1-t2)*(1-t2)*fromPos.y + 2*(1-t2)*t2*controlY + t2*t2*toPos.y;
    const startPoint = getCircleEdgePoint(fromPos.x, fromPos.y, approxStartX, approxStartY, true);

    pathData = `M ${startPoint.x} ${startPoint.y} Q ${controlX} ${controlY} ${endPoint.x} ${endPoint.y}`;

    if (!labelX) labelX = controlX;
    if (!labelY) labelY = controlY - 10;
  }
  else if (pathType === 'loop') {
    const loopSize = 50;
    const angle1 = -Math.PI / 4;
    const startX = fromPos.x + STATE_RADIUS * Math.cos(angle1);
    const startY = fromPos.y + STATE_RADIUS * Math.sin(angle1);

    const angle2 = -3 * Math.PI / 4;
    const endX = fromPos.x + STATE_RADIUS * Math.cos(angle2);
    const endY = fromPos.y + STATE_RADIUS * Math.sin(angle2);

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

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#3b82f6');
  path.setAttribute('stroke-width', '3');
  path.setAttribute('marker-end', 'url(#arrowhead)');
  path.classList.add('transition-path');

  console.log(`Created transition ${from} → ${to} with arrowhead`);

  group.appendChild(path);

  return group;
}

// CREATE INITIAL STATE ARROW
function createInitialStateArrow() {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.classList.add('initial-arrow');
  
  const s0Pos = STATE_POSITIONS['S0'];
  const STATE_RADIUS = 35;
  
  // Arrow starts from the left, pointing to S0
  const startX = s0Pos.x - STATE_RADIUS - 40;
  const startY = s0Pos.y;
  const endX = s0Pos.x - STATE_RADIUS;
  const endY = s0Pos.y;
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${startX} ${startY} L ${endX} ${endY}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#3b82f6');
  path.setAttribute('stroke-width', '3');
  path.setAttribute('marker-end', 'url(#arrowhead)');
  
  group.appendChild(path);
  
  return group;
}

// CREATE COMPLETE DIAGRAM
function createStateDiagram() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 1000 600');
  svg.id = 'state-diagram';

  // Arrowhead markers
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

  // Regular arrowhead for transitions
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.id = 'arrowhead';
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '9');
  marker.setAttribute('refY', '5');
  marker.setAttribute('markerWidth', '6');
  marker.setAttribute('markerHeight', '6');
  marker.setAttribute('orient', 'auto-start-reverse');

  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', '0 0, 10 5, 0 10');
  polygon.setAttribute('fill', '#3b82f6');

  marker.appendChild(polygon);
  defs.appendChild(marker);
  
  svg.appendChild(defs);

  console.log('✓ Arrowhead markers created');

  const transitionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  transitionsGroup.id = 'transitions';

  const statesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  statesGroup.id = 'states';

  // Draw initial state arrow first
  const initialArrow = createInitialStateArrow();
  transitionsGroup.appendChild(initialArrow);

  // Draw transitions (behind states)
  TRANSITIONS.forEach(trans => {
    const transitionElement = createTransition(trans.from, trans.to, trans.label, trans.path);
    if (transitionElement) {
      transitionsGroup.appendChild(transitionElement);
    }
  });

  // Draw states on top
  Object.keys(STATE_POSITIONS).forEach(stateId => {
    const pos = STATE_POSITIONS[stateId];
    const isAccept = (stateId === 'S7');
    const stateNode = createStateNode(stateId, pos.x, pos.y, pos.label, isAccept);
    statesGroup.appendChild(stateNode);
  });

  svg.appendChild(transitionsGroup);
  svg.appendChild(statesGroup);

  return svg;
}

// MAP STATE VALUES TO STATE IDs
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

// HIGHLIGHT CURRENT STATE
function highlightState(stateValue) {
  const stateId = STATE_VALUE_TO_ID[stateValue] || stateValue;

  console.log(`🎯 Highlighting state: ${stateValue} → ${stateId}`);

  const allStates = document.querySelectorAll('.state-node');
  allStates.forEach(node => {
    node.classList.remove('active');
  });

  const currentState = document.getElementById(`state-${stateId}`);
  if (currentState) {
    currentState.classList.add('active');
    console.log(`✓ State ${stateId} highlighted successfully`);
    currentState.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    console.error(`❌ State element not found: state-${stateId}`);
  }
}

// ANIMATE TRANSITION
function animateTransition(fromStateValue, toStateValue) {
  const fromState = STATE_VALUE_TO_ID[fromStateValue] || fromStateValue;
  const toState = STATE_VALUE_TO_ID[toStateValue] || toStateValue;

  const transition = document.querySelector(
    `.transition[data-from="${fromState}"][data-to="${toState}"]`
  );

  if (!transition) {
    console.warn(`Transition not found: ${fromState} -> ${toState}`);
    return;
  }

  transition.classList.add('pulse');

  setTimeout(() => {
    transition.classList.remove('pulse');
  }, 600);
}

// TOGGLE DIAGRAM PANEL (kept for backward compatibility)
function toggleDiagram(visible) {
  console.log('toggleDiagram called:', visible);
}

// INITIALIZE DIAGRAM
function initializeDiagram() {
  console.log('Initializing state diagram...');

  const container = document.getElementById('diagram-container');
  if (!container) {
    console.error('Diagram container not found!');
    return;
  }

  const diagram = createStateDiagram();
  container.appendChild(diagram);

  highlightState('S0');

  console.log('Diagram initialized successfully');
}