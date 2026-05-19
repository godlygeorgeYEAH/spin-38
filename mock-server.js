const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ── Configuración ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const ROUND_DURATION_SEC = parseInt(process.env.ROUND_DURATION_SEC || '300', 10);
const SPIN_SEC = 15;    // segundos en estado "spinning"
const REVEAL_SEC = 15;  // segundos en estado "revealing"
const IDLE_SEC = Math.max(1, ROUND_DURATION_SEC - SPIN_SEC - REVEAL_SEC);
const MAX_HISTORY = 50;

// ── Pool de posiciones: ruleta americana (38 valores) ────────────────────────
const ROULETTE_POOL = [0, '00', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
  26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36];

// ── Estado en memoria ────────────────────────────────────────────────────────
let roundId = 1;
let state = 'idle';
let secondsRemaining = IDLE_SEC;
let currentResult = null;  // { outerPosition, innerPosition }
const history = [];        // orden cronológico descendente, máx MAX_HISTORY

// ── Helpers ──────────────────────────────────────────────────────────────────
function randomPosition() {
  return ROULETTE_POOL[Math.floor(Math.random() * ROULETTE_POOL.length)];
}

function pushHistory(entry) {
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.pop();
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// ── Ciclo de ronda ───────────────────────────────────────────────────────────
setInterval(() => {
  secondsRemaining--;

  if (secondsRemaining <= 0) {
    if (state === 'idle') {
      state = 'spinning';
      secondsRemaining = SPIN_SEC;
      currentResult = { outerPosition: randomPosition(), innerPosition: randomPosition() };
      log(`[ROUND-${roundId}] idle → spinning  outer=${currentResult.outerPosition} inner=${currentResult.innerPosition}`);

    } else if (state === 'spinning') {
      state = 'revealing';
      secondsRemaining = REVEAL_SEC;
      log(`[ROUND-${roundId}] spinning → revealing`);

    } else if (state === 'revealing') {
      pushHistory({
        roundId,
        outerPosition: currentResult.outerPosition,
        innerPosition: currentResult.innerPosition,
        timestamp: new Date().toISOString(),
      });
      roundId++;
      state = 'idle';
      secondsRemaining = IDLE_SEC;
      currentResult = null;
      log(`[ROUND-${roundId - 1}] revealing → idle  (nueva ronda: ${roundId})`);
    }
  }
}, 1000);

// ── Endpoints ────────────────────────────────────────────────────────────────

// GET /api/round/current
app.get('/api/round/current', (req, res) => {
  res.json({ id: roundId, state, secondsRemaining });
});

// GET /api/round/:id/result
app.get('/api/round/:id/result', (req, res) => {
  const id = parseInt(req.params.id, 10);

  const histEntry = history.find(h => h.roundId === id);
  if (histEntry) {
    log(`[ROUND-${histEntry.roundId}] resultado entregado → outer=${histEntry.outerPosition} inner=${histEntry.innerPosition}`);
    return res.json({
      roundId: histEntry.roundId,
      outerPosition: histEntry.outerPosition,
      innerPosition: histEntry.innerPosition,
    });
  }

  if (id === roundId && currentResult) {
    log(`[ROUND-${roundId}] resultado entregado → outer=${currentResult.outerPosition} inner=${currentResult.innerPosition}`);
    return res.json({ roundId, ...currentResult });
  }

  res.status(404).json({ error: 'Resultado no disponible aún para esta ronda' });
});

// POST /api/round/:id/ack
app.post('/api/round/:id/ack', (req, res) => {
  const id = req.params.id;
  log(`[ROUND-${id}] ACK recibido`);
  res.json({ ok: true });
});

// GET /api/history
app.get('/api/history', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '20', 10), MAX_HISTORY);
  res.json(history.slice(0, limit));
});

// ── Arranque ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Mock server escuchando en http://localhost:${PORT}`);
  console.log(`Ciclo: ${ROUND_DURATION_SEC}s total  (idle ${IDLE_SEC}s → spinning ${SPIN_SEC}s → revealing ${REVEAL_SEC}s)`);
  console.log(`Para ciclo acortado: ROUND_DURATION_SEC=30 npm run mock-server`);
});
