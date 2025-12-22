# ChibiBot 🤖

![Discord Bot](https://img.shields.io/badge/Discord.js-v14-7289DA?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-16.x+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/github/license/Matt0k/ChibiBot?style=for-the-badge&logo=gnu)

Un bot Discord multifonctionnel conçu pour offrir une expérience de gestion de serveur complète et interactive.

## ✨ Fonctionnalités

-   **🔨 Modération complète** : Commandes `ban`, `kick`, `timeout`, `tempban`, `unban`, et `clear` avec un système de sanctions intégré.
-   **💰 Économie avancée** : Gagnez de l'argent en envoyant des messages, achetez des objets dans un magasin de serveur, et consultez les classements.
-   **📈 Système de Niveaux & XP** : Les utilisateurs gagnent de l'expérience et montent de niveau en participant à la vie du serveur.
-   **👋 Messages de Bienvenue** : Accueillez les nouveaux membres avec des messages personnalisables.
-   **📝 Logs détaillés** : Gardez une trace de toutes les actions importantes sur votre serveur.
-   **⚙️ Panneau de Configuration** : Configurez facilement tous les modules via des commandes intuitives.
-   **😂 Commandes amusantes** : `8ball`, `blague`, `ship`, et bien plus pour engager votre communauté.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé les éléments suivants :

-   [Node.js](https://nodejs.org/) (version 16.9.0 ou supérieure)
-   Une base de données [MariaDB](https://mariadb.org/) ou [MySQL](https://www.mysql.com/).

## 🚀 Installation

Suivez ces étapes pour configurer et lancer votre propre instance de ChibiBot.

**1. Cloner le Dépôt**

```bash
git clone https://github.com/Matt0k/ChibiBot.git
cd ChibiBot
```

**2. Installer les Dépendances**

Utilisez `npm` pour installer tous les paquets nécessaires.

```bash
npm install
```

**3. Configurer le Bot**

Vous devez créer un fichier de configuration pour les informations sensibles.

-   Renommez le fichier `config.example.json` en `config.json`.
-   Ouvrez `config.json` et remplissez les champs requis :
    -   `token` : Le token de votre bot Discord.
    -   `clientId` : L'ID client de votre bot.
    -   `db` : Les informations de connexion à votre base de données.

**4. Déployer les Commandes Slash**

Chaque fois que vous modifiez ou ajoutez une commande, vous devez les redéployer sur Discord.

```bash
npm run deploy
```

**5. Lancer le Bot**

Une fois la configuration terminée, vous pouvez démarrer le bot.

```bash
npm start
```

## 📂 Structure du Projet

```
.
├── src/
│   ├── commands/       # Contient toutes les commandes slash du bot.
│   ├── events/         # Gère les événements Discord (ready, messageCreate, etc.).
│   ├── utils/          # Fonctions et constantes utilitaires.
│   └── database.js     # Gère la connexion et les requêtes à la base de données.
├── config.example.json # Modèle pour le fichier de configuration.
├── deploy-commands.js  # Script pour déployer les commandes.
├── index.js            # Point d'entrée principal du bot.
└── package.json        # Dépendances et scripts du projet.
```

## 📜 Licence

Ce projet est sous licence AGPL-3.0. Voir le fichier `LICENSE` pour plus de détails.

