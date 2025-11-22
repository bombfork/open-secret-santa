#!/usr/bin/env node

/**
 * Script to add share-related translation keys to all locale files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, '../locales');

// Translation values for each language
const translations = {
  en: {
    shareButton: "Share",
    shareTitle: "Secret Santa for {name}",
    shareText: "Here's your Secret Santa assignment link for {name}",
    shareAdminTitle: "Secret Santa Admin Link",
    shareAdminText: "Here's the admin link to view all Secret Santa assignments",
    shareNotSupported: "Sharing is not supported on this device"
  },
  fr: {
    shareButton: "Partager",
    shareTitle: "Père Noël Secret pour {name}",
    shareText: "Voici votre lien d'attribution de Père Noël Secret pour {name}",
    shareAdminTitle: "Lien Administrateur du Père Noël Secret",
    shareAdminText: "Voici le lien administrateur pour voir toutes les attributions du Père Noël Secret",
    shareNotSupported: "Le partage n'est pas pris en charge sur cet appareil"
  },
  es: {
    shareButton: "Compartir",
    shareTitle: "Amigo Invisible para {name}",
    shareText: "Aquí está tu enlace de asignación de Amigo Invisible para {name}",
    shareAdminTitle: "Enlace de Administrador del Amigo Invisible",
    shareAdminText: "Aquí está el enlace de administrador para ver todas las asignaciones del Amigo Invisible",
    shareNotSupported: "Compartir no está soportado en este dispositivo"
  },
  de: {
    shareButton: "Teilen",
    shareTitle: "Wichteln für {name}",
    shareText: "Hier ist dein Wichtel-Zuordnungslink für {name}",
    shareAdminTitle: "Wichtel-Admin-Link",
    shareAdminText: "Hier ist der Admin-Link, um alle Wichtel-Zuordnungen anzuzeigen",
    shareNotSupported: "Teilen wird auf diesem Gerät nicht unterstützt"
  },
  it: {
    shareButton: "Condividi",
    shareTitle: "Babbo Natale Segreto per {name}",
    shareText: "Ecco il tuo link di assegnazione del Babbo Natale Segreto per {name}",
    shareAdminTitle: "Link Amministratore del Babbo Natale Segreto",
    shareAdminText: "Ecco il link amministratore per visualizzare tutte le assegnazioni del Babbo Natale Segreto",
    shareNotSupported: "La condivisione non è supportata su questo dispositivo"
  },
  pt: {
    shareButton: "Compartilhar",
    shareTitle: "Amigo Secreto para {name}",
    shareText: "Aqui está o seu link de atribuição do Amigo Secreto para {name}",
    shareAdminTitle: "Link de Administrador do Amigo Secreto",
    shareAdminText: "Aqui está o link de administrador para ver todas as atribuições do Amigo Secreto",
    shareNotSupported: "Compartilhar não é suportado neste dispositivo"
  },
  nl: {
    shareButton: "Delen",
    shareTitle: "Geheime Kerstman voor {name}",
    shareText: "Hier is je Geheime Kerstman toewijzingslink voor {name}",
    shareAdminTitle: "Geheime Kerstman Beheerder Link",
    shareAdminText: "Hier is de beheerder link om alle Geheime Kerstman toewijzingen te bekijken",
    shareNotSupported: "Delen wordt niet ondersteund op dit apparaat"
  },
  pl: {
    shareButton: "Udostępnij",
    shareTitle: "Tajemniczy Mikołaj dla {name}",
    shareText: "Oto Twój link przypisania Tajemniczego Mikołaja dla {name}",
    shareAdminTitle: "Link Administratora Tajemniczego Mikołaja",
    shareAdminText: "Oto link administratora do przeglądania wszystkich przypisań Tajemniczego Mikołaja",
    shareNotSupported: "Udostępnianie nie jest obsługiwane na tym urządzeniu"
  },
  ru: {
    shareButton: "Поделиться",
    shareTitle: "Тайный Санта для {name}",
    shareText: "Вот ваша ссылка на назначение Тайного Санты для {name}",
    shareAdminTitle: "Ссылка администратора Тайного Санты",
    shareAdminText: "Вот ссылка администратора для просмотра всех назначений Тайного Санты",
    shareNotSupported: "Обмен не поддерживается на этом устройстве"
  },
  ja: {
    shareButton: "共有",
    shareTitle: "{name}のシークレットサンタ",
    shareText: "{name}のシークレットサンタ割り当てリンクです",
    shareAdminTitle: "シークレットサンタ管理者リンク",
    shareAdminText: "すべてのシークレットサンタ割り当てを表示する管理者リンクです",
    shareNotSupported: "このデバイスでは共有がサポートされていません"
  },
  zh: {
    shareButton: "分享",
    shareTitle: "{name}的神秘圣诞老人",
    shareText: "这是{name}的神秘圣诞老人分配链接",
    shareAdminTitle: "神秘圣诞老人管理员链接",
    shareAdminText: "这是查看所有神秘圣诞老人分配的管理员链接",
    shareNotSupported: "此设备不支持分享"
  },
  ca: {
    shareButton: "Compartir",
    shareTitle: "Pare Noel Secret per a {name}",
    shareText: "Aquí tens el teu enllaç d'assignació del Pare Noel Secret per a {name}",
    shareAdminTitle: "Enllaç d'Administrador del Pare Noel Secret",
    shareAdminText: "Aquí tens l'enllaç d'administrador per veure totes les assignacions del Pare Noel Secret",
    shareNotSupported: "Compartir no està suportat en aquest dispositiu"
  },
  eu: {
    shareButton: "Partekatu",
    shareTitle: "Olentzero Sekretua {name}-(r)entzat",
    shareText: "Hona hemen zure Olentzero Sekretuaren esleipen-esteka {name}-(r)entzat",
    shareAdminTitle: "Olentzero Sekretuaren Administratzaile Esteka",
    shareAdminText: "Hona hemen administratzaile esteka Olentzero Sekretuaren esleipen guztiak ikusteko",
    shareNotSupported: "Partekatzea ez da onartzen gailu honetan"
  },
  gl: {
    shareButton: "Compartir",
    shareTitle: "Papá Noel Secreto para {name}",
    shareText: "Aquí tes a túa ligazón de asignación do Papá Noel Secreto para {name}",
    shareAdminTitle: "Ligazón de Administrador do Papá Noel Secreto",
    shareAdminText: "Aquí tes a ligazón de administrador para ver todas as asignacións do Papá Noel Secreto",
    shareNotSupported: "Compartir non está soportado neste dispositivo"
  },
  oc: {
    shareButton: "Partejar",
    shareTitle: "Pair Nadal Secret per {name}",
    shareText: "Vaquí vòstre ligam d'assignacion del Pair Nadal Secret per {name}",
    shareAdminTitle: "Ligam Administrator del Pair Nadal Secret",
    shareAdminText: "Vaquí lo ligam administrator per veire totas las assignacions del Pair Nadal Secret",
    shareNotSupported: "Partejar es pas suportat sus aqueste aparelh"
  },
  tlh: {
    shareButton: "ngeH",
    shareTitle: "QaStaHvIS Secret {name}",
    shareText: "naDev QaStaHvIS Secret assignment link {name}",
    shareAdminTitle: "QaStaHvIS Secret Admin Link",
    shareAdminText: "naDev admin link Hoch QaStaHvIS Secret assignments legh",
    shareNotSupported: "ngeH ghobe' jan De'vam"
  },
  sjn: {
    shareButton: "Juohkit",
    shareTitle: "Čuvges Juovllastállu {name}",
    shareText: "Dás lea du Čuvges Juovllastállu juohkima-liŋka {name}",
    shareAdminTitle: "Čuvges Juovllastállu Administráhtorliŋka",
    shareAdminText: "Dás lea administráhtorliŋka oainnit buot Čuvges Juovllastállu juohkimiid",
    shareNotSupported: "Juohkin ii doarjjahuvvo dán ovttadagas"
  },
  qya: {
    shareButton: "Camila",
    shareTitle: "Núra Atar {name}n",
    shareText: "Sina ná cen Núra Atar apsenë sambë {name}n",
    shareAdminTitle: "Núra Atar Cáno Sambë",
    shareAdminText: "Sina ná i cáno sambë tire ilya Núra Atar apsenë",
    shareNotSupported: "Camila lá avalda sina sambassë"
  }
};

// Process each locale file
const localeFiles = fs.readdirSync(localesDir)
  .filter(file => file.endsWith('.json') && file !== 'schema.json');

localeFiles.forEach(file => {
  const filePath = path.join(localesDir, file);
  const lang = path.basename(file, '.json');

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const locale = JSON.parse(content);

    // Check if translations are already present
    if (locale.results && locale.results.shareButton) {
      console.log(`✓ ${file} already has share translations`);
      return;
    }

    // Get translations for this language (fallback to English if not available)
    const trans = translations[lang] || translations.en;

    // Add new keys to results section
    if (locale.results) {
      locale.results.shareButton = trans.shareButton;
      locale.results.shareTitle = trans.shareTitle;
      locale.results.shareText = trans.shareText;
      locale.results.shareAdminTitle = trans.shareAdminTitle;
      locale.results.shareAdminText = trans.shareAdminText;
    }

    // Add new key to validation section
    if (locale.validation) {
      locale.validation.shareNotSupported = trans.shareNotSupported;
    }

    // Write back to file with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(locale, null, 2) + '\n', 'utf8');
    console.log(`✓ Updated ${file}`);
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
});

console.log('\nDone!');
