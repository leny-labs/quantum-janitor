# talking-portrait (vendored)

Copie **buildée** (`dist/`) de https://github.com/leny-labs/talking-portrait @ `d7cbaac`,
vendorée pour que `npm ci` fonctionne en CI sans dossier sibling.

Mise à jour : dans le repo talking-portrait, `npm run build`, puis recopier
`dist/`, `README.md`, `LICENSE` ici (package.json : sans `scripts` ni `devDependencies`),
puis `npm install` dans quantum-janitor.
