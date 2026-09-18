#!/usr/bin/env node
/**
 * Prépare l'ajout d'une mercerie dans le mini backoffice.
 *
 * Usage :
 *   node scripts/mercerie-password.mjs "Mercerie du Coin"
 *   node scripts/mercerie-password.mjs "Mercerie du Coin" "monMotDePasse" "Nantes"
 *
 * Sans mot de passe, un mot de passe lisible est tiré au sort.
 * Le script n'écrit rien en base : il affiche la ligne SQL à coller dans
 * Supabase → SQL editor. Le mot de passe en clair n'est jamais stocké.
 *
 * L'algorithme doit rester identique à netlify/functions/mercerie-api.js
 * (PBKDF2-SHA256, 32 octets, sortie hex).
 */

import { pbkdf2Sync, randomBytes, randomInt } from "node:crypto";

const ITERATIONS = 150000;
const WORDS = ["aiguille", "bobine", "canevas", "dentelle", "fuseau", "lisiere", "navette", "ourlet", "passepoil", "velours"];

function randomPassword() {
  const word = WORDS[randomInt(WORDS.length)];
  const other = WORDS[randomInt(WORDS.length)];
  return `${word}-${other}-${randomInt(100, 1000)}`;
}

function sqlQuote(value) {
  return value == null ? "null" : `'${String(value).replace(/'/g, "''")}'`;
}

const [name, passwordArg, city, email] = process.argv.slice(2);

if (!name) {
  console.error('Usage : node scripts/mercerie-password.mjs "Nom de la mercerie" ["mot de passe"] ["Ville"] ["email"]');
  process.exit(1);
}

const password = (passwordArg || randomPassword()).trim();
if (password.length < 8) {
  console.error("Mot de passe trop court : 8 caractères minimum.");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256").toString("hex");

console.log(`\nMercerie      : ${name}`);
console.log(`Mot de passe  : ${password}   ← à transmettre à la mercerie (et à personne d'autre)`);
console.log(`\nSQL à exécuter dans Supabase :\n`);
console.log(
  `insert into public.merceries (name, city, contact_email, password_salt, password_hash, password_iterations)\n` +
    `values (${sqlQuote(name)}, ${sqlQuote(city || null)}, ${sqlQuote(email || null)}, ${sqlQuote(salt)}, ${sqlQuote(hash)}, ${ITERATIONS});\n`
);
console.log("Chaque mercerie doit avoir un mot de passe différent : c'est lui qui l'identifie.\n");
