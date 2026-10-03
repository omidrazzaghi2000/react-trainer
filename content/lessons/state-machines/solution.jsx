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
  switch (state.status) {
    case 'idle':
    case 'live':
    case 'failed':
      if (event.type === 'DEPLOY') return { status: 'deploying', branch: event.branch };
      return state;
    case 'deploying':
      if (event.type === 'CANCEL') return { status: 'idle' };
      if (event.type === 'SUCCESS') {
        return { status: 'live', branch: state.branch, url: event.url };
      }
      if (event.type === 'FAILURE') {
        return { status: 'failed', branch: state.branch, error: event.error };
      }
      return state;
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
