# Parcours démo back-office (exécutable)

Ce document décrit un parcours de démonstration réaliste + une vérification automatique.

## 1) Lancer l'app

```bash
npm install
npm run dev
```

Puis ouvrir: `http://localhost:3000/dashboard`

## 2) Parcours démo recommandé (10-15 min)

1. **Dashboard** (`/dashboard`)
   - Montrer les KPIs globaux (revenu, uptime, sessions, incidents).
   - Ouvrir la section alertes pour lancer l'histoire “pilotage opérationnel”.

2. **Sites** (`/sites` puis `/sites/[id]`)
   - Filtrer par partenaire.
   - Ouvrir un site actif et expliquer benchmark + performance mensuelle.

3. **Incidents** (`/incidents` puis `/incidents/[id]`)
   - Filtrer les incidents ouverts.
   - Ouvrir une fiche incident pour montrer SLA, timeline et ETA.

4. **Revenus** (`/revenues`)
   - Mettre en avant la logique royalties et les écarts signalés.
   - Expliquer la synthèse IA de rapport.

5. **Déploiements** (`/deployments` puis `/deployments/[id]`)
   - Montrer la progression des milestones et les retards.

6. **Documents** (`/documents`) + **Campagnes** (`/campaigns`)
   - Illustrer le suivi business (documents contractuels et activation marketing).

## 3) Vérification automatique (smoke test)

```bash
npm run demo:smoke
```

Ce script:
- lance le serveur de dev;
- teste les pages clés (dashboard, sites, incidents, revenus);
- teste des endpoints API critiques (`/api/dashboard`, `/api/sites`, `/api/incidents?openOnly=true`, `/api/revenues?summary=true`).

Si tout passe, le back-office est prêt pour une démo fonctionnelle de bout-en-bout.
