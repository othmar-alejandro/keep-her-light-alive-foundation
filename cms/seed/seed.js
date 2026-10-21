/**
 * Hygraph Seed Script — Keep Her Light Alive Foundation
 *
 * Populates Hygraph with existing site content and publishes all entries.
 * Run AFTER schema is created in Hygraph (manually or via MCP).
 *
 * Usage:
 *   npm install node-fetch dotenv
 *   HYGRAPH_ENDPOINT=... HYGRAPH_MANAGEMENT_TOKEN=... node seed.js
 *
 * Dry-run mode (logs mutations without executing):
 *   DRY_RUN=true node seed.js
 */

require('dotenv').config({ path: '../.env' });
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const ENDPOINT = process.env.HYGRAPH_ENDPOINT;         // Content API endpoint
const TOKEN    = process.env.HYGRAPH_MANAGEMENT_TOKEN; // Management API token (write access)
const DRY_RUN  = process.env.DRY_RUN === 'true';

if (!ENDPOINT || !TOKEN) {
  console.error('Missing HYGRAPH_ENDPOINT or HYGRAPH_MANAGEMENT_TOKEN in environment.');
  process.exit(1);
}

// ── Core fetcher ────────────────────────────────────────────────
async function gql(query, variables = {}) {
  if (DRY_RUN) {
    console.log('[DRY RUN] Would execute:', query.trim().slice(0, 80), '...');
    console.log('  Variables:', JSON.stringify(variables, null, 2));
    return { data: {} };
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error('GraphQL Error:', JSON.stringify(json.errors, null, 2));
    throw new Error('GraphQL mutation failed');
  }
  return json.data;
}

// ── Publish helper ───────────────────────────────────────────────
async function publishEntry(modelApiId, id) {
  const mutation = /* GraphQL */ `
    mutation PublishEntry($id: ID!) {
      publish${modelApiId}(where: { id: $id }, to: PUBLISHED) { id }
    }
  `;
  return gql(mutation, { id });
}

// ════════════════════════════════════════════════════════════════
// SEED DATA
// ════════════════════════════════════════════════════════════════

// ── A. GlobalSiteSettings ────────────────────────────────────────
async function seedGlobalSettings() {
  console.log('\n[1/8] Seeding GlobalSiteSettings...');
  const mutation = /* GraphQL */ `
    mutation CreateGlobalSettings($data: GlobalSiteSettingCreateInput!) {
      createGlobalSiteSetting(data: $data) { id }
    }
  `;
  const data = await gql(mutation, {
    data: {
      siteName: 'Keep Her Light Alive Foundation',
      primaryEmail: 'Keepherlightalivesmr@gmail.com',
      primaryPhone: '786-874-1881',
      locationText: 'Florida, United States',
      donateUrl: 'https://www.paypal.com/donate/?hosted_button_id=FYXLKLEVQ5VYQ',
      instagramUrl: 'https://instagram.com/keepherlightalive',
      footerText: '© 2026 Keep Her Light Alive Foundation. All rights reserved. | Designed by OAC Digital Innovations',
      seoDefaultTitle: 'Stephanie Marie Rodriguez Memorial | Keep Her Light Alive Foundation',
      seoDefaultDescription: 'Join the Keep Her Light Alive Foundation honoring the radiant spirit of Stephanie Marie Rodriguez (Stephanie M. Rodriguez). Discover boating safety resources to prevent tragedies.',
    },
  });
  const id = data.createGlobalSiteSetting?.id;
  if (id) await publishEntry('GlobalSiteSetting', id);
  console.log('  ✓ GlobalSiteSettings created:', id || '(dry run)');
}

// ── B. CoinInitiativeSettings ────────────────────────────────────
async function seedCoinSettings() {
  console.log('\n[2/8] Seeding CoinInitiativeSettings...');
  const mutation = /* GraphQL */ `
    mutation CreateCoinSettings($data: CoinInitiativeSettingCreateInput!) {
      createCoinInitiativeSetting(data: $data) { id }
    }
  `;
  // Rich text must be sent as Hygraph RichText input (raw JSON or HTML string)
  const bodyHtml = `
    <p>Inspired by Stephanie's boundless generosity, this coin is a symbol of purposeless kindness.
    One side bears our promise: <strong>"Keep Her Light Alive,"</strong> while the other connects you
    to a community of good deeds.</p>
    <p>When you receive this coin, hold it, scan it, and then pass it on by performing a random act
    of kindness. Let the ripple effect begin.</p>
    <p>When you request a coin, we will mail a physical token directly to your address as a token of
    our heartfelt appreciation. Keep it as a beautiful remembrance of Stephanie's vibrant spirit,
    or pass it along to inspire others.</p>
  `.trim();

  const data = await gql(mutation, {
    data: {
      heading: 'The Coin Initiative',
      body: { html: bodyHtml },
      requestCoinCtaUrl: '#contact-form',
      donateCtaUrl: 'https://www.paypal.com/donate/?hosted_button_id=FYXLKLEVQ5VYQ',
      // qrCodeImage and coinFrontImage: upload manually or via MCP uploadAsset tool
    },
  });
  const id = data.createCoinInitiativeSetting?.id;
  if (id) await publishEntry('CoinInitiativeSetting', id);
  console.log('  ✓ CoinInitiativeSettings created:', id || '(dry run)');
}

// ── C. Founders ──────────────────────────────────────────────────
async function seedFounders() {
  console.log('\n[3/8] Seeding Founders...');
  const founders = [
    { name: 'Magaly Bea',       roleTitle: 'Co-Founder', sortOrder: 1, photoFile: 'founder-magaly-pro.png'     },
    { name: 'Midalys Armas',    roleTitle: 'Co-Founder', sortOrder: 2, photoFile: 'founder-midalys-pro-1.png'  },
    { name: 'Natalie Fitoria',  roleTitle: 'Co-Founder', sortOrder: 3, photoFile: 'founder-natalie-pro.png'    },
  ];

  const mutation = /* GraphQL */ `
    mutation CreateFounder($data: FounderCreateInput!) {
      createFounder(data: $data) { id }
    }
  `;

  for (const f of founders) {
    // NOTE: photo asset must be pre-uploaded via Hygraph UI or MCP uploadAsset.
    // After upload, replace photoAssetId with the returned asset ID.
    const data = await gql(mutation, {
      data: {
        name: f.name,
        roleTitle: f.roleTitle,
        sortOrder: f.sortOrder,
        // photo: { connect: { id: '<ASSET_ID_FROM_UPLOAD>' } },  // uncomment after upload
      },
    });
    const id = data.createFounder?.id;
    if (id) await publishEntry('Founder', id);
    console.log(`  ✓ Founder "${f.name}" created:`, id || '(dry run)', `— upload photo: ${f.photoFile}`);
  }
}

// ── D. FAQ Items ─────────────────────────────────────────────────
async function seedFAQs() {
  console.log('\n[4/8] Seeding FAQ Items...');
  const faqs = [
    {
      sortOrder: 1,
      question: 'What is Keep Her Light Alive Foundation?',
      answer: '<p>We are a nonprofit organization dedicated to preventing boating accidents through education, advocacy, and community support. Founded in memory of Stephanie Marie Rodriguez, we work to ensure no family experiences the preventable tragedy of losing a loved one on the water.</p>',
    },
    {
      sortOrder: 2,
      question: 'How can I get a Coin of Kindness?',
      answer: '<p>You can request a coin through our contact form or at any of our events. Each coin is free and comes with a simple mission: perform an act of kindness, then pass it on. The QR code on the back lets you track the coin\'s journey and see the ripple effect of good deeds.</p>',
    },
    {
      sortOrder: 3,
      question: 'How can I support the foundation?',
      answer: '<p>There are many ways to help: volunteer at our events, sponsor a safety workshop, share our resources with boaters in your community, or make a donation. Every contribution helps us provide free safety education and support families affected by boating accidents.</p>',
    },
    {
      sortOrder: 4,
      question: 'Are your boating safety courses really free?',
      answer: '<p>Yes! All our safety courses, workshops, and educational resources are completely free. We believe that financial barriers should never prevent anyone from learning life-saving water safety skills.</p>',
    },
    {
      sortOrder: 5,
      question: 'Where do you operate?',
      answer: '<p>We primarily serve South Florida, including Miami-Dade County, Hialeah, and the Florida Keys. However, our educational resources are available to anyone, and we\'re working to expand our reach throughout Florida.</p>',
    },
    {
      sortOrder: 6,
      question: 'How can I share my story or get support?',
      answer: '<p>If you or your family have been affected by a boating accident, please reach out through our contact form or call us directly. We provide emotional support, connect families with resources, and offer a compassionate community of people who understand your experience.</p>',
    },
  ];

  const mutation = /* GraphQL */ `
    mutation CreateFAQItem($data: FAQItemCreateInput!) {
      createFAQItem(data: $data) { id }
    }
  `;

  const ids = [];
  for (const faq of faqs) {
    const data = await gql(mutation, {
      data: {
        question: faq.question,
        answer: { html: faq.answer },
        sortOrder: faq.sortOrder,
      },
    });
    const id = data.createFAQItem?.id;
    if (id) await publishEntry('FAQItem', id);
    ids.push(id);
    console.log(`  ✓ FAQ "${faq.question.slice(0, 50)}..." created:`, id || '(dry run)');
  }
  return ids;
}

// ── E. Resources ─────────────────────────────────────────────────
async function seedResources() {
  console.log('\n[5/8] Seeding Resources...');
  const resources = [
    {
      title: 'Boating Safety Pre-Departure Checklist',
      type: 'link',
      category: 'checklist',
      description: 'Essential pre-departure safety checklist from Florida Fish and Wildlife Conservation Commission.',
      url: 'https://myfwc.com/boating/safety-education/safety-equipment/',
      sourceLabel: 'Official FWC',
      sortOrder: 1,
      isFeatured: true,
    },
    {
      title: 'Coast Guard Life Jacket Guidelines',
      type: 'link',
      category: 'guidelines',
      description: 'U.S. Coast Guard guidelines on approved life jackets and proper usage.',
      url: 'https://www.uscgboating.org/safety/life_jacket_wear.php',
      sourceLabel: 'U.S. Coast Guard',
      sortOrder: 2,
      isFeatured: true,
    },
    {
      title: 'Florida Boating Regulations',
      type: 'link',
      category: 'regulations',
      description: 'Official Florida boating laws, regulations, and safety requirements.',
      url: 'https://myfwc.com/boating/waterway/regulations/',
      sourceLabel: 'Official FWC',
      sortOrder: 3,
      isFeatured: false,
    },
  ];

  const mutation = /* GraphQL */ `
    mutation CreateResource($data: ResourceCreateInput!) {
      createResource(data: $data) { id }
    }
  `;

  for (const r of resources) {
    const data = await gql(mutation, { data: r });
    const id = data.createResource?.id;
    if (id) await publishEntry('Resource', id);
    console.log(`  ✓ Resource "${r.title}" created:`, id || '(dry run)');
  }
}

// ── F. Contact Topics ─────────────────────────────────────────────
async function seedContactTopics() {
  console.log('\n[6/8] Seeding Contact Topics...');
  const topics = [
    { label: 'General Inquiry',   value: 'General Inquiry',   sortOrder: 1 },
    { label: 'Request a Coin',    value: 'Request a Coin',     sortOrder: 2 },
    { label: 'Volunteering',      value: 'Volunteering',       sortOrder: 3 },
    { label: 'Donation Support',  value: 'Donation Support',   sortOrder: 4 },
    { label: 'Press / Media',     value: 'Press / Media',      sortOrder: 5 },
  ];

  const mutation = /* GraphQL */ `
    mutation CreateContactTopic($data: ContactTopicCreateInput!) {
      createContactTopic(data: $data) { id }
    }
  `;

  for (const t of topics) {
    const data = await gql(mutation, { data: t });
    const id = data.createContactTopic?.id;
    if (id) await publishEntry('ContactTopic', id);
    console.log(`  ✓ ContactTopic "${t.label}" created:`, id || '(dry run)');
  }
}

// ── G. Initiatives ────────────────────────────────────────────────
async function seedInitiatives() {
  console.log('\n[7/8] Seeding Initiatives...');
  const initiatives = [
    {
      title: 'Boating Safety Education',
      summary: 'Partnering with local authorities to provide free water safety resources and educational workshops across Miami-Dade and the Florida Keys.',
      ctaLabel: 'Watch Safety Videos',
      ctaUrl: 'https://www.youtube.com/results?search_query=boating+safety+education+florida',
      sortOrder: 1,
      isFeatured: true,
    },
    {
      title: 'Water Safety Events in Florida',
      summary: 'Memorial walks, boating safety seminars in Hialeah and Miami — community events to bring people together for healing and education.',
      ctaLabel: 'Learn More',
      ctaUrl: '#events',
      sortOrder: 2,
      isFeatured: true,
    },
    {
      title: 'Florida Boating Safety Advocacy',
      summary: 'Advocating for stricter boating safety laws and regulations in Florida to help prevent accidents and ensure every boat trip ends safely.',
      sortOrder: 3,
      isFeatured: true,
    },
    {
      title: 'The Coin Initiative',
      summary: 'A symbol of purposeless kindness — request a coin, perform a random act of kindness, and pass it on to inspire a ripple of good deeds.',
      ctaLabel: 'Learn About the Coin',
      ctaUrl: '#about-coin',
      sortOrder: 4,
      isFeatured: false,
    },
  ];

  const mutation = /* GraphQL */ `
    mutation CreateInitiative($data: InitiativeCreateInput!) {
      createInitiative(data: $data) { id }
    }
  `;

  for (const i of initiatives) {
    const data = await gql(mutation, { data: i });
    const id = data.createInitiative?.id;
    if (id) await publishEntry('Initiative', id);
    console.log(`  ✓ Initiative "${i.title}" created:`, id || '(dry run)');
  }
}

// ── H. Legal Pages ────────────────────────────────────────────────
async function seedLegalPages() {
  console.log('\n[8/8] Seeding Legal Pages...');

  const privacyBody = /* HTML (trimmed excerpt — paste full text from privacy-policy.html) */ `
    <h2>Introduction</h2>
    <p>Keep Her Light Alive Foundation ("we," "us," or "our") is a nonprofit organization dedicated to
    promoting boating safety awareness across Florida. We value your privacy and are committed to
    protecting your personal information.</p>
    <p><em>⚠️ Paste the full privacy policy HTML body here before running in production.</em></p>
    <h2>Contact Us</h2>
    <p>Email: <a href="mailto:Keepherlightalivesmr@gmail.com">Keepherlightalivesmr@gmail.com</a></p>
    <p>Phone: <a href="tel:786-874-1881">786-874-1881</a></p>
    <p>Location: Florida, United States</p>
  `.trim();

  const termsBody = /* HTML */ `
    <h2>Terms of Use</h2>
    <p>By accessing this website, you agree to comply with these Terms of Use.</p>
    <p><em>⚠️ Paste the full terms of use HTML body here before running in production.</em></p>
  `.trim();

  const legalPages = [
    { slug: 'privacy-policy', title: 'Privacy Policy', lastUpdated: '2026-02-03', body: privacyBody },
    { slug: 'terms-of-use',   title: 'Terms of Use',   lastUpdated: '2026-02-03', body: termsBody },
  ];

  const mutation = /* GraphQL */ `
    mutation CreateLegalPage($data: LegalPageCreateInput!) {
      createLegalPage(data: $data) { id }
    }
  `;

  for (const p of legalPages) {
    const data = await gql(mutation, {
      data: {
        slug: p.slug,
        title: p.title,
        lastUpdated: p.lastUpdated,
        body: { html: p.body },
      },
    });
    const id = data.createLegalPage?.id;
    if (id) await publishEntry('LegalPage', id);
    console.log(`  ✓ LegalPage "${p.title}" created:`, id || '(dry run)');
  }
}

// ════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Keep Her Light Alive — Hygraph Seed Script');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log('='.repeat(60));

  try {
    await seedGlobalSettings();
    await seedCoinSettings();
    await seedFounders();
    const faqIds = await seedFAQs();
    await seedResources();
    await seedContactTopics();
    await seedInitiatives();
    await seedLegalPages();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Seed complete!');
    console.log('\nNext steps:');
    console.log('  1. Upload founder photos via Hygraph UI → Assets, note each asset ID');
    console.log('  2. Re-run with photo asset IDs to link them to Founder entries');
    console.log('  3. Upload coin-front.png + coin-back.png, link to CoinInitiativeSettings');
    console.log('  4. Create Pages (mission, stephanies-story, initiatives, events, resources, contact)');
    console.log('     in Hygraph UI, add sections, and link to FAQ/Founder entries above.');
    console.log('  5. Set HYGRAPH_ENDPOINT + HYGRAPH_TOKEN in your frontend .env');
    console.log('='.repeat(60));
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  }
}

main();
