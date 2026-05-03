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
