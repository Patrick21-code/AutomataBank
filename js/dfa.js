
//define states
const STATES = {
    S0: 'idle',             //q0 - start state
    S1: 'card_inserted',
    S2: 'pin_entry',
    S3: 'authenticated',
    S4: 'transaction',
    S5: 'rejected',         //wrong PIN, can retry
    S6: 'done'              //accepting state
}
