const express = require("express");
const session = require("express-session");
const path = require("path");
const crypto = require("crypto");

const app = express();
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
    tag: "DOSSIER A — CHRONOLOGIE",
    intro:
      "Le gardien affirme que la porte des archives a été verrouillée à 20 h 05. Après cette heure, personne ne pouvait entrer ni sortir.",
    evidence: [
      "ALINE — « J'ai quitté le bâtiment à 19 h 55. »",
      "BENOÎT — « J'étais dans le hall à 20 h 02. »",
      "NORA — « Je suis entrée dans les archives à 20 h 07 pour récupérer mon sac. »",
      "SAMIR — « J'ai entendu le verrou se fermer à 20 h 05. »",
    ],
    question:
      "Quel témoignage est incompatible avec le verrouillage ? Saisissez le prénom.",
    hints: [
      "Ne cherchez pas un code. Construisez simplement une ligne du temps.",
      "Comparez l'heure du verrouillage avec l'heure d'entrée annoncée.",
    ],
    answer: "NORA",
    explanation:
      "Nora affirme être entrée à 20 h 07, alors que la porte était déjà verrouillée à 20 h 05. Son témoignage est impossible selon les règles du dossier.",
  },
  {
    id: 2,
    title: "La lettre du bibliothécaire",
    tag: "DOSSIER B — MESSAGE",
    intro:
      "Une note a été retrouvée au dos d'un livre. Le bibliothécaire avait une habitude étrange : il ignorait le premier mot, puis lisait un mot sur deux.",
    evidence: [
      "« Le SILENCE couvre CLE les SOUS vieux LE tiroirs TAPIS oubliés ROUGE depuis longtemps. »",
      "Note en marge : « Commence au deuxième mot. Garde ensuite un mot, saute le suivant. »",
    ],
    question: "Quel mot important apparaît à la fin de cette lecture ?",
    hints: [
      "Numérotez les mots dans l'ordre, sans compter la ponctuation.",
      "Les mots retenus forment l'expression « SOUS LE TAPIS ROUGE ». Quel objet sert de cachette ?",
    ],
    answer: "TAPIS",
    explanation:
      "En prenant un mot sur deux à partir du deuxième, on obtient SILENCE, CLE, SOUS, LE, TAPIS, ROUGE. L'expression de lieu est « SOUS LE TAPIS ROUGE » : l'objet qui sert de cachette est le TAPIS.",
  },
  {
    id: 3,
    title: "Le registre des objets",
    tag: "DOSSIER C — ARCHIVES",
    intro:
      "Le registre contient plusieurs numéros. Une annotation précise : « Le dossier recherché est le seul numéro strictement supérieur à 16 et strictement inférieur à 18. »",
    evidence: [
      "Dossier 12 — inventaire du sous-sol",
      "Dossier 16 — factures anciennes",
      "Dossier 17 — correspondance personnelle",
      "Dossier 18 — plans du bâtiment",
      "Dossier 21 — rapports techniques",
    ],
    question: "Quel est le numéro du dossier recherché ?",
    hints: [
      "« Strictement supérieur » signifie plus grand, sans inclure 16.",
      "Il n'existe qu'un entier entre 16 et 18.",
    ],
    answer: "17",
    explanation: "Le seul entier strictement compris entre 16 et 18 est 17.",
  },
  {
    id: 4,
    title: "Les cinq lignes",
    tag: "DOSSIER D — DERNIÈRE NOTE",
    intro:
      "Une feuille froissée a été retrouvée dans la corbeille. Le message est composé de cinq lignes. Une consigne accompagne le papier : « Le début de chaque ligne compte davantage que sa fin. »",
    evidence: [
      "Caché dans le silence, le dossier attend.",
      "Au milieu des ombres, personne ne regarde.",
      "Chaque minute éloigne les curieux.",
      "Hier n'explique pas toujours aujourd'hui.",
      "Enfin, la vérité reste à découvrir.",
    ],
    question:
      "Quel verbe est caché dans cette note ? Écrivez-le en majuscules.",
    hints: [
      "Observez le tout début de chaque ligne.",
      "Lisez la première lettre de chaque ligne, de haut en bas.",
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
    return res
      .status(429)
      .json({
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
  return res
    .status(400)
    .json({
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
