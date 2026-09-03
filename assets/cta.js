/* Every way to reach the founder, written once for the whole site.
 *
 * Both pages carry CTAs; neither hardcodes an address or a number. Every CTA
 * ships with an in-page href="#contact" fallback in the markup and is upgraded
 * here, so with scripting off the buttons scroll to the contact section rather
 * than pointing at a wrong or dead address.
 *
 * To change how people reach him — swapping the gmail for an address on the
 * domain once one is assigned, or changing the number — edit the two constants
 * below. Nowhere else. The number in particular appears in three forms and they
 * must agree; scripts/check-claims.mjs derives all three from PHONE.tel and
 * fails if they have drifted, so a typo in one cannot survive a commit.
 */
(function () {
  var CONTACT = 'helloluxiven@gmail.com';
  var PHONE = {
    display: '+91 94137 37872',   // what a reader sees
    tel: '+919413737872',         // tel: — E.164, country code, no spaces
    wa: '919413737872',           // wa.me — same digits, no plus
  };

  var SUBJECTS = {
    access: 'SIGMORA — early access',
    hello: 'SIGMORA — hello',
    partner: 'SIGMORA — design partner',
  };
  // WhatsApp opens with the message already typed, so the first move is sending
  // it rather than composing it. Plain sentences: this is a prefill, not a pitch.
  var WA_TEXT = {
    access: 'Hi — I saw the SIGMORA site and would like an early look.',
    hello: 'Hi — I saw the SIGMORA site and wanted to get in touch.',
    partner: 'Hi — I read the design partner section on the SIGMORA site and would like to talk.',
  };

  var each = function (sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); };
  var subjectOf = function (a) { return a.getAttribute('data-cta-subject') || 'access'; };

  // mailto:
  each('[data-cta]', function (a) {
    a.href = 'mailto:' + CONTACT + '?subject=' + encodeURIComponent(SUBJECTS[subjectOf(a)]);
    // The one place the address is shown rather than linked.
    if (a.hasAttribute('data-cta-addr')) a.textContent = CONTACT;
  });

  // WhatsApp. An <a href> is navigation, not a fetch, so this needs no CSP change:
  // default-src never sees it. Labelled in the markup, never an icon alone.
  each('[data-wa]', function (a) {
    a.href = 'https://wa.me/' + PHONE.wa + '?text=' + encodeURIComponent(WA_TEXT[subjectOf(a)]);
    a.rel = 'noopener';
  });

  // tel:
  each('[data-tel]', function (a) {
    a.href = 'tel:' + PHONE.tel;
    if (a.hasAttribute('data-tel-show')) a.textContent = PHONE.display;
  });
})();
