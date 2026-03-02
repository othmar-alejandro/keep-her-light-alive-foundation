/**
 * cms.js — Runtime Hygraph CMS integration
 * Fetches dynamic content and replaces hardcoded HTML sections.
 * Falls back silently to hardcoded content if the fetch fails.
 */
(function () {
  var ENDPOINT = 'https://api-us-west-2.hygraph.com/v2/cmm1zo3c701dl07wctz81kt8e/master';
  var TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImdjbXMtbWFpbi1wcm9kdWN0aW9uIn0.eyJ2ZXJzaW9uIjozLCJpYXQiOjE3NzI0NzU2MTAsImF1ZCI6WyJodHRwczovL2FwaS11cy13ZXN0LTIuaHlncmFwaC5jb20vdjIvY21tMXpvM2M3MDFkbDA3d2N0ejgxa3Q4ZS9tYXN0ZXIiLCJtYW5hZ2VtZW50LW5leHQuZ3JhcGhjbXMuY29tIl0sImlzcyI6Imh0dHBzOi8vbWFuYWdlbWVudC11cy13ZXN0LTIuaHlncmFwaC5jb20vIiwic3ViIjoiNDNlZDg3MWMtYTgzNi00OTMzLTg2ZTktNDkyYjhmMTc2ZGNjIiwianRpIjoiY21tOWk3cG15MGV6cjA3bjZjcG5vMDduYiJ9.xjRNCJsxWbkMAbMHWnKtEtmLBAzSAIsJ0Hk_101PTRvYu-4TfkUsMEJZVTr5auXGF_cemoDUX_j7f3ZkKGfY7ep9FVokxkZK-YpAAtWHjihN7nJhUp9pLyET4d-3HdHPs3g-_PHY28Kd24LkV-HMZ4XEnmCnC9lTdl39_qG5V8hyih1US-V8rtxknOaGwvULT6Ovx7utrN_sud0HjScQ2ijdetppTKf1bZcs9b1xWpZ1sPXXXUJy-BwN2HfSvjptUUdpr_ApHnEib-sIA44cG-nYIpgSC2iP7CAfEJzRW7rj3yQkHH_L-P34vXizQVL9CNou9eAVRVNXxcK9XWYqaL3bSpf6EKvRlRuus4jXos-D4ugbnNxHx1wKosJet7Np8PW0VJQ2z2QdJO3vuNUdrQ5Z2zNUElR87sAa6OYdNAhiAjxCetYzFi82Eysl7efBl1oA4BkTDS7HosnHiw8gVK1mjcv2jopVnLkOhOlBuR85HkEizUP1kxG3EmJBsOiDQ5E0vCit6UEdA4QRzvh47ZOI8uCrjTiBfpiGpqG2g1vu6Awv_5nH6sGXV7TEPuvr8xMn9NCETV81NY0R0jdplxv2qXWGFaI2PDQOtFfOB3TbG45LVK_Adm52DWGN8yOlDcyAy_gZtEwEthirv2gHzHSu1cwxaGmyGgWLi774ipU';

  function buildQuery(nowISO) {
    return 'query($now: DateTime!) {\n' +
      '  founders(orderBy: sortOrder_ASC, stage: PUBLISHED) {\n' +
      '    name roleTitle\n' +
      '    photo { url }\n' +
      '  }\n' +
      '  fAQItems(orderBy: sortOrder_ASC, stage: PUBLISHED) {\n' +
      '    question\n' +
      '    answer { html }\n' +
      '  }\n' +
      '  resources(orderBy: sortOrder_ASC, stage: PUBLISHED) {\n' +
      '    title url resourceType sourceLabel\n' +
      '  }\n' +
      '  events(\n' +
      '    where: { startDateTime_gte: $now, isPublic: true }\n' +
      '    orderBy: startDateTime_ASC\n' +
      '    stage: PUBLISHED\n' +
      '  ) {\n' +
      '    title eventStatus startDateTime endDateTime\n' +
      '    locationName city registrationUrl\n' +
      '  }\n' +
      '  globalSiteSettings(first: 1, stage: PUBLISHED) {\n' +
      '    primaryEmail primaryPhone locationText instagramUrl\n' +
      '  }\n' +
      '  coinInitiativeSettings(first: 1, stage: PUBLISHED) {\n' +
      '    body { html } donateCtaUrl\n' +
      '  }\n' +
      '  legalPages(where: { slug: "stephanie-story" }, first: 1, stage: PUBLISHED) {\n' +
      '    body { html }\n' +
      '  }\n' +
      '}';
  }

  // --- helpers ---

  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function el(id) { return document.getElementById(id); }

  // --- fetch ---

  function fetchCMS() {
    var now = new Date().toISOString();
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + TOKEN
      },
      body: JSON.stringify({ query: buildQuery(now), variables: { now: now } })
    })
    .then(function (res) { return res.json(); })
    .then(function (json) {
      if (json.errors) {
        console.warn('[CMS] Hygraph errors:', json.errors);
        return null;
      }
      return json.data;
    })
    .catch(function (err) {
      console.warn('[CMS] Fetch failed, using hardcoded fallback.', err);
      return null;
    });
  }

  // --- render: founders ---

  function renderFounders(founders) {
    var grid = el('founders-grid');
    if (!grid || !founders || !founders.length) return;

    grid.innerHTML = founders.map(function (f) {
      var imgSrc = (f.photo && f.photo.url) ? esc(f.photo.url) : '';
      var imgTag = imgSrc
        ? '<img src="' + imgSrc + '" alt="' + esc(f.name) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">'
        : '<div class="w-full h-full bg-gray-200 flex items-center justify-center"><i data-lucide="user" class="w-12 h-12 text-gray-400"></i></div>';

      return '<div class="text-center group">' +
        '<div class="w-48 h-48 mx-auto rounded-full overflow-hidden mb-6 shadow-lg group-hover:shadow-2xl transition-all duration-500 border-4 border-white">' +
          imgTag +
        '</div>' +
        '<h3 class="text-xl font-serif font-bold text-gray-900 mb-2">' + esc(f.name) + '</h3>' +
        '<p class="text-brand-gold text-xs uppercase tracking-widest font-bold mb-4">' + esc(f.roleTitle || 'Co-Founder') + '</p>' +
      '</div>';
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // --- render: FAQ accordion ---

  function initAccordion(container) {
    container.querySelectorAll('.accordion-item').forEach(function (item) {
      var button = item.querySelector('button');
      var icon = item.querySelector('.accordion-icon');
      if (!button) return;

      button.addEventListener('click', function () {
        var isOpen = item.classList.contains('active');

        // close all
        container.querySelectorAll('.accordion-item').forEach(function (other) {
          other.classList.remove('active');
          var oi = other.querySelector('.accordion-icon');
          if (oi) oi.setAttribute('data-lucide', 'plus');
        });

        if (!isOpen) {
          item.classList.add('active');
          if (icon) icon.setAttribute('data-lucide', 'x');
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
      });
    });
  }

  function renderFAQs(faqs) {
    var list = el('faq-list');
    if (!list || !faqs || !faqs.length) return;

    list.innerHTML = faqs.map(function (faq) {
      var answerHtml = (faq.answer && faq.answer.html) ? faq.answer.html : '';
      return '<div class="accordion-item bg-white rounded-2xl border border-gray-100 overflow-hidden">' +
        '<button class="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors">' +
          '<h3 class="font-serif text-xl text-gray-900 pr-8">' + esc(faq.question) + '</h3>' +
          '<i data-lucide="plus" class="accordion-icon w-6 h-6 text-brand-gold flex-shrink-0"></i>' +
        '</button>' +
        '<div class="accordion-content px-8 pb-6">' +
          '<div class="text-gray-600 leading-relaxed">' + answerHtml + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    initAccordion(list);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // --- render: resources ---

  var RESOURCE_STYLES = [
    { bg: 'bg-blue-50',         text: 'text-blue-600',    hover: 'group-hover:text-blue-600',    icon: 'file-text'    },
    { bg: 'bg-green-50',        text: 'text-green-600',   hover: 'group-hover:text-green-600',   icon: 'life-buoy'    },
    { bg: 'bg-brand-gold/10',   text: 'text-brand-gold',  hover: 'group-hover:text-brand-gold',  icon: 'shield-check' }
  ];

  function renderResources(resources) {
    var list = el('resources-list');
    if (!list || !resources || !resources.length) return;

    list.innerHTML = resources.map(function (r, i) {
      var s = RESOURCE_STYLES[i % RESOURCE_STYLES.length];
      return '<a href="' + esc(r.url || '#') + '" target="_blank" rel="noopener noreferrer" ' +
          'class="group bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer block">' +
        '<div class="flex items-center gap-4">' +
          '<div class="w-12 h-12 ' + s.bg + ' rounded-full flex items-center justify-center ' + s.text + '">' +
            '<i data-lucide="' + s.icon + '" class="w-6 h-6"></i>' +
          '</div>' +
          '<div>' +
            '<h4 class="font-serif text-lg text-gray-900 ' + s.hover + ' transition-colors">' + esc(r.title) + '</h4>' +
            '<span class="text-xs text-gray-400 uppercase tracking-wider">' + esc(r.sourceLabel || '') + '</span>' +
          '</div>' +
        '</div>' +
        '<i data-lucide="external-link" class="w-5 h-5 text-gray-300 ' + s.hover + ' transition-colors"></i>' +
      '</a>';
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // --- render: events ---

  var STATUS_LABELS = {
    planned:   'Upcoming',
    scheduled: 'Scheduled',
    completed: 'Past Event',
    canceled:  'Canceled'
  };

  var STATUS_COLORS = {
    planned:   'bg-brand-gold/10 text-brand-gold',
    scheduled: 'bg-blue-50 text-blue-600',
    completed: 'bg-gray-100 text-gray-500',
    canceled:  'bg-red-50 text-red-400'
  };

  function formatEventDate(isoString) {
    if (!isoString) return '';
    var d = new Date(isoString);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  }

  function formatEventTime(isoString) {
    if (!isoString) return '';
    var d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function renderEvents(events) {
    var list    = el('events-list');
    var comingSoon = el('events-coming-soon');
    if (!list) return;

    if (!events || !events.length) {
      // keep coming-soon visible, nothing to do
      return;
    }

    list.innerHTML = events.map(function (ev) {
      var statusKey   = ev.eventStatus || 'planned';
      var statusLabel = STATUS_LABELS[statusKey] || statusKey;
      var statusClass = STATUS_COLORS[statusKey] || STATUS_COLORS.planned;
      var dateStr     = formatEventDate(ev.startDateTime);
      var timeStr     = formatEventTime(ev.startDateTime);
      var location    = [ev.locationName, ev.city].filter(Boolean).join(' — ');
      var regBtn      = ev.registrationUrl
        ? '<a href="' + esc(ev.registrationUrl) + '" target="_blank" rel="noopener noreferrer" ' +
            'class="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-dark border-b border-black pb-0.5 hover:text-brand-gold hover:border-brand-gold transition-colors">' +
            'Register <i data-lucide="arrow-right" class="w-4 h-4"></i></a>'
        : '';

      return '<div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col">' +
        '<span class="inline-block self-start text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5 ' + statusClass + '">' + esc(statusLabel) + '</span>' +
        '<h3 class="font-serif text-xl text-gray-900 mb-4 leading-snug">' + esc(ev.title) + '</h3>' +
        '<div class="flex items-start gap-2 text-gray-500 text-sm mb-2">' +
          '<i data-lucide="calendar" class="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0"></i>' +
          '<span>' + esc(dateStr) + (timeStr ? ' · ' + esc(timeStr) : '') + '</span>' +
        '</div>' +
        (location ? '<div class="flex items-start gap-2 text-gray-500 text-sm mb-2">' +
          '<i data-lucide="map-pin" class="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0"></i>' +
          '<span>' + esc(location) + '</span>' +
        '</div>' : '') +
        regBtn +
      '</div>';
    }).join('');

    // Show list, hide coming-soon
    list.classList.remove('hidden');
    list.classList.add('grid');
    if (comingSoon) comingSoon.classList.add('hidden');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // --- render: coin initiative ---

  function renderCoin(settings) {
    var s = Array.isArray(settings) ? settings[0] : settings;
    if (!s) return;

    var coinBody = el('coin-body');
    if (coinBody && s.body && s.body.html) {
      // Wrap CMS paragraphs with the same styling classes
      var html = s.body.html
        .replace(/<p>/g, '<p class="text-gray-300 text-lg leading-relaxed mb-8 max-w-lg">')
        .replace(/<\/p>/g, '</p>');
      coinBody.innerHTML = html;
    }

    var donateBtn = el('coin-cta-donate');
    if (donateBtn && s.donateCtaUrl) {
      donateBtn.href = s.donateCtaUrl;
    }
  }

  // --- render: Stephanie's story ---

  function renderLegacy(pages) {
    var container = el('legacy-body');
    if (!container || !pages || !pages.length) return;
    var page = pages[0];
    if (!page || !page.body || !page.body.html) return;

    var parser = new DOMParser();
    var doc = parser.parseFromString(page.body.html, 'text/html');

    // Style blockquotes and their inner paragraphs first
    doc.querySelectorAll('blockquote').forEach(function (bq) {
      bq.className = 'border-l-2 border-brand-gold pl-6 py-2 my-8';
      bq.querySelectorAll('p').forEach(function (p) {
        p.className = 'font-serif text-2xl italic text-gray-800';
      });
    });

    // Style top-level paragraphs
    doc.querySelectorAll('body > p').forEach(function (p) {
      p.className = 'text-xl text-gray-600 leading-relaxed font-light';
    });

    container.innerHTML = doc.body.innerHTML;
  }

  // --- render: contact info + footer ---

  function renderContactInfo(settings) {
    var list = settings;
    var s = Array.isArray(list) ? list[0] : list;
    if (!s) return;

    // Contact section
    var contactEmail    = el('contact-email');
    var contactPhone    = el('contact-phone');
    var contactLocation = el('contact-location');

    if (contactEmail && s.primaryEmail) {
      contactEmail.href        = 'mailto:' + s.primaryEmail;
      contactEmail.textContent = s.primaryEmail;
    }
    if (contactPhone && s.primaryPhone) {
      contactPhone.href        = 'tel:' + s.primaryPhone;
      contactPhone.textContent = s.primaryPhone;
    }
    if (contactLocation && s.locationText) {
      contactLocation.textContent = s.locationText;
    }

    // Footer
    var footerEmailIcon = el('footer-email-icon');
    var footerEmailText = el('footer-email-text');
    var footerPhone     = el('footer-phone');
    var footerLocation  = el('footer-location');
    var footerInstagram = el('footer-instagram');

    if (footerEmailIcon && s.primaryEmail) {
      footerEmailIcon.href = 'mailto:' + s.primaryEmail;
    }
    if (footerEmailText && s.primaryEmail) {
      footerEmailText.href        = 'mailto:' + s.primaryEmail;
      footerEmailText.textContent = s.primaryEmail;
    }
    if (footerPhone && s.primaryPhone) {
      footerPhone.href        = 'tel:' + s.primaryPhone;
      footerPhone.textContent = s.primaryPhone;
    }
    if (footerLocation && s.locationText) {
      footerLocation.textContent = s.locationText;
    }
    if (footerInstagram && s.instagramUrl) {
      footerInstagram.href = s.instagramUrl;
    }
  }

  // --- boot ---

  document.addEventListener('DOMContentLoaded', function () {
    fetchCMS().then(function (data) {
      if (!data) return;
      renderFounders(data.founders);
      renderFAQs(data.fAQItems);
      renderResources(data.resources);
      renderEvents(data.events);
      renderCoin(data.coinInitiativeSettings);
      renderLegacy(data.legalPages);
      renderContactInfo(data.globalSiteSettings);
    });
  });
})();
