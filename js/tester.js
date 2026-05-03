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