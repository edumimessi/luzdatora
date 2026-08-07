import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../docs/devocionais.js", import.meta.url), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);
const entries = sandbox.window.DEVOTIONAL_ENTRIES;
const required = ["concept","theme","heading","verse","reference","context","reflection","action","question"];
const errors = [];
if (!Array.isArray(entries) || entries.length !== 31) errors.push("O ciclo deve conter exatamente 31 leituras.");
entries?.forEach((entry, index) => {
  required.forEach(field => {
    if (typeof entry[field] !== "string" || entry[field].trim().length < 4) errors.push(`Leitura ${index + 1}: campo ${field} ausente ou curto.`);
  });
  if (!/\d+[:–-]\d+|\d+:\d+|\d+ ·/.test(entry.reference)) errors.push(`Leitura ${index + 1}: referência sem capítulo e verso.`);
  if (!/(paráfrase editorial|tradução próxima|tradução literal|trecho do verso)/.test(entry.reference)) errors.push(`Leitura ${index + 1}: tipo textual não identificado.`);
});
for (const field of ["heading","verse","reflection","action","question"]) {
  const values = entries?.map(entry => entry[field].trim().toLocaleLowerCase("pt-BR")) || [];
  if (new Set(values).size !== values.length) errors.push(`Há duplicatas exatas no campo ${field}.`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OK: ${entries.length} leituras únicas, completas e com referências tipificadas.`);
