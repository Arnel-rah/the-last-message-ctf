const express = require("express");
const session = require("express-session");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;
const ORGANIZER_PASSWORD =
  process.env.ORGANIZER_PASSWORD || "change-this-password";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "change-this-session-secret";
const FINAL_CODE = (
  process.env.FINAL_CODE || crypto.randomBytes(16).toString("hex")
).toUpperCase();
const MAX_ATTEMPTS_PER_WINDOW = 8;
const ATTEMPT_WINDOW_MS = 60 * 1000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  session({
    name: "lastmessage.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);

// Answers and explanations stay on the server. Never move this object into public/.
const stages = [
  {
    id: 1,
    title: "Le témoignage impossible",
    tag: "DOSSIER A — ORDRE DES PASSAGES",
    intro:
      "Le registre des passages a été déchiré. Il reste seulement quatre témoignages, chacun décrivant une relation d'ordre.",
    evidence: [
      "BENOÎT — « Mon passage a eu lieu juste avant celui de SAMIR. »",
      "SAMIR — « Je suis passé avant NORA. »",
      "NORA — « Je suis passée avant ALINE. »",
      "ALINE — « Je n'étais pas la première. »",
      "Règle du registre : chaque personne apparaît une seule fois.",
    ],
    question:
      "Reconstituez l'ordre complet, puis indiquez le prénom en troisième position.",
    hints: [
      "Transformez chaque phrase en relation avant/après.",
      "Commencez par la relation la plus contrainte, puis vérifiez les quatre places.",
    ],
    answer: "NORA",
    explanation:
      "Benoît est immédiatement avant Samir, Samir est avant Nora, et Nora est avant Aline. La seule chaîne compatible est BENOÎT-SAMIR-NORA-ALINE.",
  },
  {
    id: 2,
    title: "La lettre du bibliothécaire",
    tag: "DOSSIER B — PARCOURS CRYPTÉ",
    intro:
      "Une grille a été retrouvée dans la salle de lecture. Les cases vides sont des leurres : il faut suivre exactement les déplacements de la marge.",
    evidence: [
      "Grille (ligne 1 à 5) :",
      "T X A X X",
      "X X X X X",
      "X X P I X",
      "X X X X X",
      "X X X S X",
      "Marge : « Commence en haut à gauche. Garde la lettre de départ, puis avance de 2 à droite, 2 en bas, 1 à droite, 2 en bas. »",
    ],
    question: "Quel mot est parcouru ? Écrivez-le en majuscules.",
    hints: [
      "La première case compte, même avant le premier déplacement.",
      "Un déplacement de 2 franchit une case intermédiaire mais arrive deux colonnes ou lignes plus loin.",
    ],
    answer: "TAPIS",
    explanation:
      "En partant de T, les arrivées donnent A, P, I, puis S. Le parcours forme TAPIS.",
  },
  {
    id: 3,
    title: "Le registre des objets",
    tag: "DOSSIER C — FILTRE NUMÉRIQUE",
    intro:
      "Les numéros du registre sont mélangés à des dossiers leurres. Trois opérations successives permettent d'isoler le bon numéro.",
    evidence: [
      "Numéros présents : 09, 12, 14, 16, 17, 18, 21, 24.",
      "Filtre 1 : conserve les nombres impairs.",
      "Filtre 2 : parmi eux, conserve ceux strictement supérieurs à 10 et strictement inférieurs à 22.",
      "Filtre 3 : élimine le nombre dont la somme des chiffres vaut 3.",
    ],
    question:
      "Quel numéro reste après les trois filtres ? Écrivez uniquement le nombre.",
    hints: [
      "Appliquez les filtres dans l'ordre, sans réutiliser les nombres éliminés.",
      "La somme des chiffres de 21 vaut 3.",
    ],
    answer: "17",
    explanation: "Le seul entier strictement compris entre 16 et 18 est 17.",
  },
  {
    id: 4,
    title: "Les cinq lignes",
    tag: "DOSSIER D — ORDRE DE LECTURE",
    intro:
      "Cinq lignes ont été mélangées. La date inscrite au début de chaque ligne indique l'ordre réel de lecture.",
    evidence: [
      "04/04 — Hier n'explique pas toujours aujourd'hui.",
      "01/04 — Caché dans le silence, le dossier attend.",
      "05/04 — Enfin, la vérité reste à découvrir.",
      "03/04 — Chaque minute éloigne les curieux.",
      "02/04 — Au milieu des ombres, personne ne regarde.",
    ],
    question:
      "Remettez les lignes dans l'ordre des dates, puis lisez leur première lettre. Quel verbe obtenez-vous ?",
    hints: [
      "La position d'affichage n'est pas l'ordre de lecture.",
      "Après le tri, utilisez seulement la première lettre de chaque phrase.",
    ],
    answer: "CACHE",
    explanation: "Les premières lettres forment C-A-C-H-E : CACHE.",
  },
  {
    id: 5,
    title: "Le dernier message",
    tag: "DOSSIER FINAL — RECONSTRUCTION",
    intro:
      "Vous avez quatre fragments. Le dernier message indique : « Le prénom désigne la personne. Le verbe décrit son action. Le nombre désigne le dossier. La destination indique où il se trouve. »",
    evidence: [
      "Fragment 1 : le prénom trouvé dans le témoignage impossible.",
      "Fragment 2 : le verbe caché dans la dernière note.",
      "Fragment 3 : le numéro isolé dans le registre.",
      "Fragment 4 : la cachette révélée par la lettre.",
    ],
    question:
      "Reconstituez la phrase avec les quatre fragments, puis ajoutez le code final remis séparément par l'organisateur.",
    hints: [
      "Réutilisez uniquement les quatre réponses précédentes pour reconstruire la phrase.",
      "Le code final n'est jamais affiché sur ce site : demandez-le à l'organisateur de l'épreuve.",
    ],
    answer: null,
    explanation:
      "La phrase reconstruite doit être suivie du code final communiqué oralement ou sur un support séparé par l'organisateur.",
  },
];

stages[4].answer = `NORA-CACHE-17-SOUS-LE-TAPIS-${FINAL_CODE}`;

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/\s+/g, "-")
    .replace(/_+/g, "-");
}
function progress(req) {
  if (!req.session.solved) req.session.solved = [];
  return req.session.solved;
}
function currentStage(req) {
  return Math.min(progress(req).length + 1, stages.length);
}
function allowAttempt(req) {
  const now = Date.now();
  const attempts = req.session.attempts || { startedAt: now, count: 0 };
  if (now - attempts.startedAt >= ATTEMPT_WINDOW_MS) {
    attempts.startedAt = now;
    attempts.count = 0;
  }
  attempts.count += 1;
  req.session.attempts = attempts;
  return attempts.count <= MAX_ATTEMPTS_PER_WINDOW;
}

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/state", (req, res) => {
  res.set("Cache-Control", "no-store");
  const solved = progress(req);
  const current = currentStage(req);
  res.json({
    solved,
    complete: solved.length === stages.length,
    stage:
      current <= stages.length
        ? {
            id: stages[current - 1].id,
            title: stages[current - 1].title,
            tag: stages[current - 1].tag,
            intro: stages[current - 1].intro,
            evidence: stages[current - 1].evidence,
            question: stages[current - 1].question,
            hints: stages[current - 1].hints,
          }
        : null,
  });
});

app.post("/api/answer", (req, res) => {
  const solved = progress(req);
  const index = solved.length;
  if (index >= stages.length) return res.json({ ok: true, complete: true });
  if (!allowAttempt(req)) {
    return res.status(429).json({
      ok: false,
      message: "Trop de tentatives. Attendez une minute avant de continuer.",
    });
  }
  const stage = stages[index];
  if (normalize(req.body.answer) === normalize(stage.answer)) {
    solved.push(stage.id);
    return res.json({
      ok: true,
      message: "Bonne réponse. Le dossier suivant est déverrouillé.",
    });
  }
  return res.status(400).json({
    ok: false,
    message: "Ce n'est pas la bonne réponse. Reprenez les preuves calmement.",
  });
});

app.post("/api/reset", (req, res) => {
  req.session.solved = [];
  res.json({ ok: true });
});

// Organizer area: protected by a password and never linked from the player interface.
app.get("/organizer", (req, res) => {
  if (!req.session.organizer)
    return res.sendFile(path.join(__dirname, "public", "organizer-login.html"));
  res.sendFile(path.join(__dirname, "public", "organizer.html"));
});
app.post("/organizer/login", (req, res) => {
  if (String(req.body.password || "") === ORGANIZER_PASSWORD) {
    req.session.organizer = true;
    return res.redirect("/organizer");
  }
  res
    .status(401)
    .send("Mot de passe incorrect. <a href='/organizer'>Réessayer</a>");
});
app.get("/api/organizer/solutions", (req, res) => {
  if (!req.session.organizer)
    return res.status(401).json({ error: "Accès refusé" });
  res.json(
    stages.map((s) => ({
      id: s.id,
      title: s.title,
      answer: s.answer,
      explanation: s.explanation,
      hints: s.hints,
    })),
  );
});
app.post("/organizer/logout", (req, res) => {
  req.session.organizer = false;
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`THE LAST MESSAGE est disponible sur http://localhost:${PORT}`);
  if (ORGANIZER_PASSWORD === "change-this-password") {
    console.warn(
      "ATTENTION : définissez ORGANIZER_PASSWORD avant d'exposer le site sur Internet.",
    );
  }
});
