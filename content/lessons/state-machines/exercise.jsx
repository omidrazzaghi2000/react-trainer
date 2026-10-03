// Exercise: turn a trusting reducer into a state machine for a deploy button.
import { useReducer, useState } from 'react';

// Fake deploy: 200 ms; the "broken-build" branch always fails.
function fakeDeploy(branch) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (branch === 'broken-build') reject(new Error('Build failed: 2 tests are red.'));
      else resolve(`https://${branch}.example.app`);
    }, 200);
  });
}

// States:  { status: 'idle' }          { status: 'deploying', branch }
//          { status: 'live', branch, url }   { status: 'failed', branch, error }
// Events:  DEPLOY { branch } · CANCEL · SUCCESS { url } · FAILURE { error }
export function deployMachine(state, event) {
  // TODO 1: this reducer trusts every event, whatever the current state is.
  //         Switch on state.status first, and inside each state accept only:
  //           idle / live / failed → DEPLOY            (go to 'deploying')
  //           deploying            → CANCEL, SUCCESS, FAILURE
  // TODO 2: for any other event, return `state` itself (the same object).
  // TODO 3: build each new state from scratch with only its own fields —
  //         `{ ...state }` drags an old `error` or `url` into the next state.
  switch (event.type) {
    case 'DEPLOY':
      return { ...state, status: 'deploying', branch: event.branch };
    case 'CANCEL':
      return { ...state, status: 'idle' };
    case 'SUCCESS':
      return { ...state, status: 'live', url: event.url };
    case 'FAILURE':
      return { ...state, status: 'failed', error: event.error };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(deployMachine, { status: 'idle' });
  const [branch, setBranch] = useState('main');

  function deploy() {
    dispatch({ type: 'DEPLOY', branch });
    // The answer may arrive after a Cancel — the machine must decide if it still counts.
    fakeDeploy(branch).then(
      (url) => dispatch({ type: 'SUCCESS', url }),
      (err) => dispatch({ type: 'FAILURE', error: err.message }),
    );
  }

  return (
    <section className="card stack">
      <h2>Deploy</h2>
      {state.status === 'deploying' ? (
        <div className="row">
          <span className="spinner" />
          <p role="status">Deploying {state.branch}…</p>
          <button onClick={() => dispatch({ type: 'CANCEL' })}>Cancel</button>
        </div>
      ) : (
        <div className="row">
          <select
            aria-label="Branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            <option value="main">main</option>
            <option value="broken-build">broken-build</option>
          </select>
          <button className="primary" onClick={deploy}>Deploy</button>
        </div>
      )}
      {state.status === 'idle' && <p role="status">Ready to deploy</p>}
      {state.status === 'live' && <p role="status" className="success">Live at {state.url}</p>}
      {state.status === 'failed' && <p role="alert" className="error">{state.error}</p>}
    </section>
  );
}
