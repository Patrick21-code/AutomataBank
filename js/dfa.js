/*
    DFA is defined as a 5-tuple: (Q, Σ, δ, q0, F)
    - Q = set of states
    - Σ = alphabet (input symbols)
    - δ = transition function
    - q0 = start state
    - F = set of accept states
*/

//define states (Q)
const STATES = {
    S0: 'idle',             //q0 - start state
    S1: 'card_inserted',
    S2: 'pin_entry',
    S3: 'authenticated',
    S4: 'transaction',
    S5: 'rejected',         //wrong PIN, can retry
    S6: 'done'              //accepting state
}

//define alphabet (Σ)
//all possible inputs that my DFA can receive
const INPUTS = {
    INSERT_CARD: 'insert_card',
    ENTER_DIGIT: 'enter_digit',
    SUBMIT_PIN: 'submit_pin',           
    CORRECT_PIN: 'correct_pin',      //internal input
    //passed
    WRONG_PIN: 'wrong_pin',          //internal input
    //failed
    SELECT_WITHDRAW: 'select_withdraw',
    SELECT_BALANCE: 'select_balance',
    CONFIRM: 'confirm',
    CANCEL: 'cancel,',
    EJECT_CARD: 'eject_card'
}