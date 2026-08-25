/* ===========================================================
   views/store.js — Self-Care Store & Marketplace 🛍️
   =========================================================== */
import { store as db, uid } from '../store.js';
import { html, esc, toast, go, appbar, sectionH, kes } from '../ui.js';
import { PRODUCTS } from '../data.js';

const CATS = ['All', 'Journals', 'Courses'];

function hub({ cat }) {
  const active = cat || 'All';
  const items = active === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.cat === active);
  const cart = db.get().cart;
  return {
    html: html`
      ${appbar('Self-Care Store', 'Journals · Courses · Tools')}
      <div class="hero" style="background:linear-gradient(140deg,#134e4a,#0d9488)">
        <h1 style="font-size:1.2rem">🛍️ Tools for your wellbeing</h1>
        <p>Journals, courses and workbooks to support every pillar — for you or your whole team.</p>
      </div>
      <div class="chips" style="margin-bottom:12px">
        ${CATS.map(c => `<a class="chip ${active === c ? 'on' : ''}" href="#/store${c === 'All' ? '' : '?cat=' + c}">${esc(c)}</a>`).join('')}
        ${cart.length ? `<a class="chip on" href="#/cart">🛒 ${cart.length}</a>` : ''}
      </div>
      <div class="grid g2">${items.map(productCard).join('')}</div>
      <div class="card" style="margin-top:14px"><h3>For organisations</h3>
        <p class="muted">Bundle journals, courses and workshops into a corporate wellness programme.</p>
        <a class="btn" href="#/packages">See corporate packages ›</a></div>
      <div class="fab-space"></div>`,
    onMount(root) {
      root.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', e => {
        e.preventDefault();
        db.update(s => { if (!s.cart.includes(b.dataset.add)) s.cart.push(b.dataset.add); });
        toast('Added to cart 🛒'); go('#/store' + (active === 'All' ? '' : '?cat=' + active));
      }));
    },
  };
}

function productCard(p) {
  const fav = db.get().favourites.includes(p.id);
  return html`
    <div class="tile" style="justify-content:space-between">
      <div>
        <div class="emoji">${p.ico}</div>
        <div class="t">${esc(p.name)}</div>
        <div class="d">${esc(p.desc)}</div>
      </div>
      <div>
        <div class="price" style="margin:6px 0">${kes(p.price)}</div>
        <div style="display:flex;gap:6px">
          ${p.courseId ? `<a class="btn sm" href="#/course/${p.courseId}">Preview</a>` : ''}
          <button class="btn sm primary" data-add="${p.id}" style="flex:1">Add</button>
        </div>
      </div>
    </div>`;
}

function cart() {
  const ids = db.get().cart;
  const items = ids.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
  const total = items.reduce((a, p) => a + p.price, 0);
  return {
    html: html`
      ${appbar('Your cart', items.length + ' item(s)')}
      ${items.length ? html`
        <div class="card"><div class="list" id="items">
          ${items.map(p => `<div class="row"><span class="ico">${p.ico}</span>
            <span class="rt"><span class="rtl">${esc(p.name)}</span><span class="rd">${esc(p.cat)}</span></span>
            <span class="price">${kes(p.price)}</span>
            <button class="btn sm" data-rm="${p.id}" style="width:auto;margin-left:8px">✕</button></div>`).join('')}
        </div></div>
        <div class="card"><div style="display:flex;justify-content:space-between;font-weight:800;font-size:1.1rem"><span>Total</span><span class="price">${kes(total)}</span></div></div>
        <button class="btn primary" id="checkout">Checkout</button>
        <p class="muted center" style="font-size:.78rem;margin-top:8px">Demo checkout — connect M-Pesa / card at publishing.</p>
      ` : `<div class="empty"><div class="e">🛒</div><p>Your cart is empty</p><a class="btn primary" href="#/store">Browse the store</a></div>`}
      <div class="fab-space"></div>`,
    onMount(root) {
      root.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => {
        db.update(s => { s.cart = s.cart.filter(x => x !== b.dataset.rm); }); go('#/cart');
      }));
      const co = root.querySelector('#checkout');
      co && co.addEventListener('click', () => {
        // unlock course products locally as a demo "purchase"
        db.update(s => { s.cart = []; });
        toast('Purchase complete ✔ (demo)'); go('#/store');
      });
    },
  };
}

export const storeRoutes = {
  '/store': hub,
  '/cart': cart,
};
