#!/usr/bin/env node

import Ajv from 'ajv';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize AJV with strict mode
const ajv = new Ajv({ allErrors: true, verbose: true });

// Load the schema
const schemaPath = join(__dirname, '../locales/schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

// Compile the schema
const validate = ajv.compile(schema);

// Get all locale files
const localesDir = join(__dirname, '../locales');
const localeFiles = readdirSync(localesDir)
  .filter(file => file.endsWith('.json') && file !== 'schema.json')
  .sort();

console.log(`Validating ${localeFiles.length} locale files against schema...\n`);

let hasErrors = false;

// Validate each locale file
for (const file of localeFiles) {
  const filePath = join(localesDir, file);
  const localeCode = file.replace('.json', '');

  try {
    const localeData = JSON.parse(readFileSync(filePath, 'utf8'));
    const valid = validate(localeData);

    if (valid) {
      console.log(`✓ ${localeCode.padEnd(6)} - Valid`);
    } else {
      console.log(`✗ ${localeCode.padEnd(6)} - Invalid`);
      hasErrors = true;

      // Print errors
      if (validate.errors) {
        for (const error of validate.errors) {
          const path = error.instancePath || '/';
          console.log(`  - ${path}: ${error.message}`);
          if (error.params) {
            const params = JSON.stringify(error.params);
            console.log(`    Params: ${params}`);
          }
        }
      }
      console.log('');
    }
  } catch (error) {
    console.log(`✗ ${localeCode.padEnd(6)} - Parse error`);
    console.log(`  - ${error.message}\n`);
    hasErrors = true;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Validation failed! Some locale files have errors.');
  process.exit(1);
} else {
  console.log('✅ All locale files are valid!');
  process.exit(0);
}
