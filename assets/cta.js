/* The contact address, written once for the whole site.
 *
 * Both pages carry CTAs; neither hardcodes the address. Every CTA ships with an
 * in-page href="#contact" fallback in the markup and is upgraded here, so with
 * scripting off the buttons scroll to the contact section rather than pointing at
 * a wrong or dead address.
 *
 * To change the address — including swapping the gmail for an address on the
 * domain once one is assigned — edit CONTACT below. Nowhere else.
 */
(function () {
  var CONTACT = 'helloluxiven@gmail.com';
  var SUBJECTS = { access: 'SIGMORA — early access', hello: 'SIGMORA — hello' };

  Array.prototype.forEach.call(document.querySelectorAll('[data-cta]'), function (a) {
    var subject = SUBJECTS[a.getAttribute('data-cta-subject') || 'access'];
    a.href = 'mailto:' + CONTACT + '?subject=' + encodeURIComponent(subject);
    // The one place the address is shown rather than linked.
    if (a.hasAttribute('data-cta-addr')) a.textContent = CONTACT;
  });
})();
