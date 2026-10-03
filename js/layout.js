(function () {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");

  if (header) {
    header.outerHTML = `
  <div class="proto">Design prototype. Not the live store. Nothing here takes an order or a payment.</div>
  <header class="site-header">
    <div class="wrap">
      <a class="brand" href="index.html" aria-label="Golden Leaf Products home">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#f6e2a4"/><stop offset="0.5" stop-color="#c9a24a"/><stop offset="1" stop-color="#8a6420"/>
            </linearGradient>
          </defs>
          <path d="M12 1.5C5.5 8 5.5 16 12 22.5 18.5 16 18.5 8 12 1.5Z" fill="url(#lg2)"/>
          <path d="M12 6v16" stroke="#0c0a07" stroke-width="0.8" fill="none"/>
        </svg>
        <span><span class="brand-name gold-text">Golden Leaf</span><span class="brand-sub">PRODUCTS</span></span>
      </a>
      <button class="menu-btn" aria-expanded="false" aria-controls="nav">Menu</button>
      <nav class="nav" id="nav" aria-label="Main">
        <a href="index.html#shop">Shop</a>
        <a href="index.html#projects">Projects</a>
        <a href="index.html#craft">Learn</a>
        <a href="index.html#help">Help</a>
        <a class="cart" href="cart.html">Cart <span class="badge" data-cart-count hidden></span></a>
      </nav>
    </div>
  </header>`;
  }

  if (footer) {
    footer.outerHTML = `
  <footer class="site-footer">
    <div class="wrap">
      <span>Design prototype for Golden Leaf Products. Not the live store.</span>
      <span>
        <a href="https://www.facebook.com/goldenleafproducts/" rel="noopener">Facebook</a> &middot;
        <a href="https://www.instagram.com/golden.leaf.products/" rel="noopener">Instagram</a>
      </span>
    </div>
  </footer>`;
  }

  const menuBtn = document.querySelector(".menu-btn");
  const nav = document.getElementById("nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
  }
  if (window.GLPCart) window.GLPCart.renderBadge();
})();
