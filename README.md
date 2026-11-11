# THE LAST MESSAGE — CTF d'enquête

Site de CTF en français pour débutants en informatique. Les énigmes portent sur l'observation, la chronologie, la lecture attentive et la déduction.

## Prérequis

- Node.js 18 ou plus récent
- npm

## Installation sur Debian

```bash
sudo apt update
sudo apt install nodejs npm
npm install
```

## Lancement

Définissez impérativement vos secrets avant de lancer le site :

```bash
export ORGANIZER_PASSWORD='un-mot-de-passe-long-et-unique'
export SESSION_SECRET='une-longue-chaine-aleatoire-et-secrete'
# Optionnel : sinon un code aléatoire est créé à chaque démarrage.
export FINAL_CODE='code-remis-separement-aux-joueurs'
npm start
```

Ouvrez ensuite `http://localhost:3000`.

## Accès organisateur

Ouvrez `http://localhost:3000/organizer` et entrez `ORGANIZER_PASSWORD`.
Le corrigé complet est conservé dans `server.js`, côté serveur. Il n'est pas envoyé à l'interface des joueurs.
Le dernier dossier exige aussi `FINAL_CODE`, qui doit être remis séparément par l'organisateur : il n'est jamais affiché dans l'interface joueur ni dans les indices.

## Réinitialiser une partie

Chaque navigateur possède sa propre progression grâce à une session. Pour rejouer dans le même navigateur, effacez les cookies du site ou utilisez une fenêtre privée.

## Avant de le partager

- Remplacez les secrets d'exemple par de vraies valeurs.
- Hébergez derrière HTTPS si vous le rendez accessible sur Internet.
- Pour un événement réel, ajoutez une limitation de tentatives et une persistance des scores.
- Faites tester les énigmes par une personne qui ne connaît pas les réponses.
- Remettez le `FINAL_CODE` uniquement au moment prévu de l'épreuve, sur un support séparé du site.

## Note de conception

Aucun site ne peut garantir qu'une IA ne résoudra pas une énigme. Ici, le code final aléatoire et externe empêche toutefois de terminer l'épreuve à partir du seul contenu public du site, même avec une IA générative.
