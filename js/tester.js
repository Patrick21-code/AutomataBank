//for sequence of strings that we can test
//to see if the dfa reaches to accepting state and accepts it or rejects it

//parseInputString - Convert input string to array of symbols
//string to array

function parseInputString(inputString) {
  // Remove extra whitespace and convert to lowercase
  const cleaned = inputString.trim().toLowerCase();
  
  // Split by spaces, commas, or both
  // Regex: split on one or more spaces or commas
  const tokens = cleaned.split(/[\s,]+/);
  
  // Filter out empty strings (from multiple separators)
  const filtered = tokens.filter(token => token.length > 0);
  
  return filtered;
}

//validateSymbol - check if the symbol is in the alphabet
//catch typos
function validateSymbol(symbol) {
  // Get all valid symbols from INPUTS constant (from dfa.js)
  const validSymbols = Object.values(INPUTS);
  
  return validSymbols.includes(symbol);
}

//getSuggestion - suggest correction for invalid symbol
function getSuggestion(invalidSymbol) {
  const validSymbols = Object.values(INPUTS);
  
  // Find symbol with most matching characters
  let bestMatch = validSymbols[0];
  let bestScore = 0;
  
  validSymbols.forEach(symbol => {
    // Count matching characters
    let score = 0;
    for (let i = 0; i < Math.min(symbol.length, invalidSymbol.length); i++) {
      if (symbol[i] === invalidSymbol[i]) {
        score++;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = symbol;
    }
  });
  
  return bestMatch;
}

//runTestString - executre a test string through the DFA
//processes each symbol, records the trace, and lastly, determines if string is accepted

function runTestString(inputString) {
  // Parse the input
  const symbols = parseInputString(inputString);
  
  if (symbols.length === 0) {
    return {
      accepted: false,
      trace: [],
      finalState: null,
      error: 'Empty input string'
    };
  }

  // Create a fresh DFA (start from S0)
  const dfa = new ATM_DFA();
  
  // Trace will store each step: {from, symbol, to}
  const trace = [];
  
  // Process each symbol
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    
    // Validate symbol
    if (!validateSymbol(symbol)) {
      const suggestion = getSuggestion(symbol);
      return {
        accepted: false,
        trace: trace,
        finalState: dfa.currentState,
        error: `Invalid symbol: "${symbol}". Did you mean "${suggestion}"?`
      };
    }
    
    // Record state before transition
    const fromState = dfa.currentState;
    
    // Execute transition
    const result = dfa.transition(symbol);
    
    // Record this step in the trace
    trace.push({
      step: i + 1,
      from: fromState,
      symbol: symbol,
      to: result.toState,
      message: result.message
    });
  }
  
  // Check if we ended in an accept state
  const finalState = dfa.currentState;
  const accepted = dfa.isInAcceptState();
  
  return {
    accepted: accepted,
    trace: trace,
    finalState: finalState,
    error: null
  };
}

//runTestStringWithVisualization
//run test and update UI
//this function adds UI updates unlike runTestString

function runTestStringWithVisualization(inputString) {
  // Clear previous results
  clearTransitionLog();
  
  // Run the test
  const result = runTestString(inputString);
  
  // Display error if any
  if (result.error) {
    displayError(result.error);
    return;
  }
  
  // Animate the trace step-by-step
  animateTrace(result.trace, 0);
  
  // Display final result
  setTimeout(() => {
    displayResult(result.accepted, result.finalState);
  }, result.trace.length * 500);  // Wait for animation to finish
}

//animateTrace - animate each step of the trace

function animateTrace(trace, index) {
  // Base case: finished all steps
  if (index >= trace.length) {
    return;
  }
  
  const step = trace[index];
  
  // Update diagram
  highlightState(step.to);
  animateTransition(step.from, step.to);
  
  // Add to log
  addTransitionToLog(step.from, step.symbol, step.to);
  
  // Update screen
  updateScreen(step.to, step.message);
  
  // Animate next step after delay
  setTimeout(() => {
    animateTrace(trace, index + 1);
  }, 500);  // 500ms between steps
}

//DISPLAY RESULTS

//displayTrace - show the complete trace in a table
function displayTrace(trace) {
  const traceContainer = document.getElementById('trace-output');
  if (!traceContainer) return;
  
  // Clear previous trace
  traceContainer.innerHTML = '';
  
  // Create table
  const table = document.createElement('table');
  table.className = 'trace-table';
  
  // Create header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Step</th>
      <th>From</th>
      <th>Symbol</th>
      <th>To</th>
      <th>Message</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Create body
  const tbody = document.createElement('tbody');
  
  trace.forEach(step => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${step.step}</td>
      <td class="state-cell">${step.from}</td>
      <td class="symbol-cell">${step.symbol}</td>
      <td class="state-cell">${step.to}</td>
      <td class="message-cell">${step.message}</td>
    `;
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  traceContainer.appendChild(table);
}

//displayResult - show ACCEPTED or REJECTED
function displayResult(accepted, finalState) {
  const resultContainer = document.getElementById('test-result');
  if (!resultContainer) return;
  
  // Clear previous result
  resultContainer.innerHTML = '';
  
  // Create result element
  const resultDiv = document.createElement('div');
  resultDiv.className = accepted ? 'result-accepted' : 'result-rejected';
  
  if (accepted) {
    resultDiv.innerHTML = `
      <h3>✓ ACCEPTED</h3>
      <p>String is in the language L(M)</p>
      <p>Final state: <strong>${finalState}</strong> (accept state)</p>
    `;
  } else {
    resultDiv.innerHTML = `
      <h3>✗ REJECTED</h3>
      <p>String is NOT in the language L(M)</p>
      <p>Final state: <strong>${finalState}</strong> (not an accept state)</p>
    `;
  }
  
  resultContainer.appendChild(resultDiv);
  
  // Flash screen for feedback
  flashScreen(accepted ? 'success' : 'error');
}

function displayError(errorMessage) {
  const resultContainer = document.getElementById('test-result');
  if (!resultContainer) return;
  
  resultContainer.innerHTML = `
    <div class="result-error">
      <h3>⚠ Error</h3>
      <p>${errorMessage}</p>
    </div>
  `;
  
  flashScreen('error');
}

