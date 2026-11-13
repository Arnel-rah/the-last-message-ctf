const game = document.getElementById("game");
const progressText = document.getElementById("progressText");
let busy = false;

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
async function load() {
  const response = await fetch("/api/state", { cache: "no-store" });
  const state = await response.json();
  progressText.textContent = `DOSSIER ${String(Math.min(state.solved.length + 1, 5)).padStart(2, "0")} / 05`;
  if (state.complete) {
    game.innerHTML = `<div class="complete"><span class="stamp">ENQUÊTE RÉSOLUE</span><h2>Vous avez retrouvé le dernier message.</h2><p>Vous avez relié les quatre fragments sans perdre le fil.</p><p><strong>Le dossier 017 est reconstitué.</strong></p><p class="muted">Présentez votre conclusion à l'organisateur.</p></div>`;
    return;
  }
  const s = state.stage;
  game.innerHTML = `
    <div class="tag">${escapeHtml(s.tag)} • ÉPREUVE ${s.id}/5</div>
    <h2>${escapeHtml(s.title)}</h2>
    <p class="intro">${escapeHtml(s.intro)}</p>
    <ul class="evidence">${s.evidence.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
    <p class="question">${escapeHtml(s.question)}</p>
    <form id="answerForm" class="answer-row">
      <input id="answer" autocomplete="off" placeholder="Votre réponse…" aria-label="Votre réponse" required>
      <button class="btn" type="submit">VALIDER</button>
    </form>
    <p id="feedback" class="feedback" role="status"></p>
    <details class="hints"><summary>OUVRIR LES INDICES (à utiliser avec prudence)</summary>${s.hints.map((h, i) => `<p><strong>Indice ${i + 1} :</strong> ${escapeHtml(h)}</p>`).join("")}</details>`;
  document
    .getElementById("answerForm")
    .addEventListener("submit", submitAnswer);
}
async function submitAnswer(event) {
  event.preventDefault();
  if (busy) return;
  busy = true;
  const input = document.getElementById("answer");
  const feedback = document.getElementById("feedback");
  const button = event.currentTarget.querySelector("button");
  button.disabled = true;
  try {
    const response = await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: input.value }),
    });
    const result = await response.json();
    feedback.textContent =
      result.message || (result.ok ? "Correct." : "Réponse incorrecte.");
    feedback.className = "feedback " + (result.ok ? "good" : "bad");
    if (result.ok) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await load();
    }
  } catch {
    feedback.textContent = "Impossible de contacter le serveur. Réessayez.";
    feedback.className = "feedback bad";
  } finally {
    busy = false;
    button.disabled = false;
  }
}
load().catch(() => {
  game.innerHTML =
    "<p>Le dossier n'a pas pu être chargé. Vérifiez que le serveur est démarré.</p>";
});
