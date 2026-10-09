(() => {
  function localDestination(rawHref) {
    try {
      const url = new URL(rawHref, window.location.origin);
      if (url.hostname !== 'piyabeauty.com' && url.hostname !== 'www.piyabeauty.com') return null;
      const path = url.pathname;
      if (path.startsWith('/collections/')) return '/#products';
      if (/turmeric-face-lotion|piya-moisturizing-face-lotion/.test(path)) return '/piya-threejs-product.html';
      if (path.startsWith('/products/')) return '/#products';
      if (path === '/pages/about-us') return '/who-we-are/';
      if (path === '/pages/purpose') return '/purpose/';
      if (path === '/pages/contact') return '/care.html#contact';
      if (path === '/policies/shipping-policy') return '/care.html#shipping';
      if (path === '/policies/refund-policy') return '/care.html#returns';
      if (path === '/policies/privacy-policy') return '/care.html#privacy';
      if (path === '/policies/terms-of-service') return '/care.html#terms';
      if (path.startsWith('/blogs/')) return '/blog/';
      return null;
    } catch (_) { return null; }
  }
  document.querySelectorAll('a[href^="https://piyabeauty.com"],a[href^="https://www.piyabeauty.com"]').forEach(link => {
    const local = localDestination(link.href);
    if (local) link.href = local;
  });
  document.querySelectorAll('[data-feature-href]').forEach(node => {
    const local = localDestination(node.dataset.featureHref);
    if (local) node.dataset.featureHref = local;
  });
  const categoryRoutes = {cleanse:'/shop/cleanse/',hydrate:'/shop/hydrate/',renew:'/shop/renew/',gift:'/shop/gift/'};
  document.querySelectorAll('.mega-links a, .categories .cat').forEach(link => {
    const name = link.querySelector('strong')?.textContent.trim().toLowerCase();
    if (categoryRoutes[name]) {
      link.href = categoryRoutes[name];
      link.target = '_self';
      link.addEventListener('click', event => {
        event.preventDefault();
        window.location.assign(categoryRoutes[name]);
      });
    }
  });
  document.querySelectorAll('.mega-links a[data-feature-href]').forEach(link => {
    const name = link.querySelector('strong')?.textContent.trim().toLowerCase();
    if (categoryRoutes[name]) link.dataset.featureHref = categoryRoutes[name];
  });
  const initialCategory = document.querySelector('.mega-links a.is-active, .mega-links a');
  const initialName = initialCategory?.querySelector('strong')?.textContent.trim().toLowerCase();
  const megaFeature = document.querySelector('.mega-feature');
  if (megaFeature && categoryRoutes[initialName]) {
    megaFeature.href = categoryRoutes[initialName];
    megaFeature.target = '_self';
  }
  document.querySelectorAll('form[action^="https://piyabeauty.com"]').forEach(form => {
    form.action = '#';
    form.addEventListener('submit', event => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      if (button) { const label = button.innerHTML; button.textContent = 'Welcome to the circle'; setTimeout(() => button.innerHTML = label, 2200); }
    });
  });
  const products = [
    {id:'glow-set',name:'Glow Turmeric Ritual Set',detail:'Cleanse · Hydrate · Glow',price:89,image:'/piya-glow-ritual-set-v2.png'},
    {id:'face-lotion',name:'Moisturizing Face Lotion',detail:'Turmeric · Rose · Daily hydration',price:34.99,image:'/piya-lotion-editorial-v6.png'},
    {id:'soap-set',name:'Original 4 Soap Gift Set',detail:'Turmeric · Neem · Tulsi · Saffron',price:43.99,image:'/piya-purpose-soaps-v2.png'},
    {id:'bakuchiol',name:'Bakuchiol Renewal Serum',detail:'Renew · Replenish · Smooth',price:39.99,image:'/piya-bakuchiol-serum.png'},
    {id:'turmeric-bar',name:'Turmeric Glow Bar Soap',detail:'Brighten · Nourish · Cleanse',price:11.99,image:'/assets/botanical-index/turmeric.png'}
  ];
  const storageKey = 'piya-beauty-cart-v1';
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(storageKey)) || []; } catch (_) {}
  const money = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
  const closeIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>';

  document.body.insertAdjacentHTML('beforeend', `
    <div class="commerce-scrim" data-commerce-close></div>
    <section class="commerce-panel commerce-full" id="piya-search" role="dialog" aria-modal="true" aria-labelledby="search-title">
      <header class="commerce-top"><a class="commerce-wordmark" href="/" aria-label="PIYA Beauty homepage">PIYA BEAUTY</a><button class="commerce-close" type="button" data-commerce-close aria-label="Close search">${closeIcon}</button></header>
      <div class="search-shell"><div class="search-heading"><div><span class="commerce-kicker">The botanical edit</span><h2 id="search-title">What are you looking for?</h2></div></div>
        <label class="search-field"><span class="sr-only" style="position:absolute;clip:rect(0 0 0 0)">Find a Product</span><input id="product-search" type="search" placeholder="Find a Product" autocomplete="off"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 5 5"></path></svg></label>
        <div class="bestseller-row"><div class="bestseller-label"><span>Most loved</span><span>Thoughtful care, rooted in ritual</span></div><div class="search-products" id="search-products"></div></div>
      </div>
    </section>
    <section class="commerce-panel commerce-full" id="piya-account" role="dialog" aria-modal="true" aria-labelledby="account-title">
      <header class="commerce-top"><a class="commerce-wordmark" href="/" aria-label="PIYA Beauty homepage">PIYA BEAUTY</a><button class="commerce-close" type="button" data-commerce-close aria-label="Close account">${closeIcon}</button></header>
      <div class="account-shell"><div class="account-copy"><div><span class="commerce-kicker">Your ritual, remembered</span><h2 id="account-title">Welcome back to PIYA.</h2><p>Sign in to revisit your favorites, keep track of your rituals, and move through checkout with ease.</p></div></div>
        <div class="account-form-wrap"><form class="account-form" id="account-form"><div class="account-tabs"><button type="button" class="account-tab is-active" data-account-mode="login">Sign in</button><button type="button" class="account-tab" data-account-mode="register">Create account</button></div><h3 id="account-form-title">Sign in</h3><p id="account-form-copy">Enter your details to continue your PIYA ritual.</p><div class="field account-name" hidden><label for="account-name">Full name</label><input id="account-name" name="name" autocomplete="name"></div><div class="field"><label for="account-email">Email address</label><input id="account-email" name="email" type="email" autocomplete="email" required></div><div class="field"><label for="account-password">Password</label><input id="account-password" name="password" type="password" autocomplete="current-password" required></div><button class="account-submit" type="submit">Continue</button><div class="account-help"><span>Secure customer access</span><a href="#">Forgot password?</a></div></form></div>
      </div>
    </section>
    <aside class="commerce-panel cart-panel" id="piya-cart" role="dialog" aria-modal="true" aria-labelledby="cart-title"><header class="cart-head"><h2 id="cart-title">Your ritual <span id="cart-title-count">0 items</span></h2><button class="commerce-close" type="button" data-commerce-close aria-label="Close cart">${closeIcon}</button></header><div class="cart-content" id="cart-content"></div><footer class="cart-foot" id="cart-foot"><div class="cart-total"><span>Subtotal</span><strong id="cart-total">$0.00</strong></div><p class="cart-note">Taxes and shipping calculated at checkout.</p><button class="cart-checkout" type="button">Continue to checkout</button></footer></aside>
  `);

  const panels = [...document.querySelectorAll('.commerce-panel')];
  const scrim = document.querySelector('.commerce-scrim');
  const productGrid = document.querySelector('#search-products');
  const searchInput = document.querySelector('#product-search');
  let lastTrigger = null;

  function renderProducts(list = products) {
    productGrid.innerHTML = list.length ? list.map(p => `<article class="search-product"><div class="search-product-media"><img src="${p.image}" alt="${p.name}"><button class="quick-add" type="button" data-add-product="${p.id}">Add to ritual</button></div><h3>${p.name}</h3><p>${p.detail} · ${money(p.price)}</p></article>`).join('') : '<div class="search-empty">No ritual found. Try “turmeric” or “hydrate”.</div>';
  }
  function saveCart(){ localStorage.setItem(storageKey,JSON.stringify(cart)); renderCart(); }
  function renderCart(){
    const count = cart.reduce((sum,item)=>sum+item.qty,0);
    document.querySelector('#cart-title-count').textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
    document.querySelector('#cart-total').textContent = money(cart.reduce((sum,item)=>sum+item.price*item.qty,0));
    document.querySelector('#cart-foot').style.display = count ? '' : 'none';
    document.querySelector('#cart-content').innerHTML = count ? cart.map(item => `<article class="cart-item"><img src="${item.image}" alt="${item.name}"><div><h3>${item.name}</h3><p>${item.detail}</p><div class="cart-qty"><button type="button" data-cart-change="${item.id}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button type="button" data-cart-change="${item.id}" data-delta="1" aria-label="Increase quantity">+</button></div><strong>${money(item.price*item.qty)}</strong></div><button class="cart-remove" type="button" data-cart-remove="${item.id}" aria-label="Remove ${item.name}">×</button></article>`).join('') : '<div class="cart-empty"><div><div class="empty-mark">PB</div><h3>Your ritual awaits.</h3><p>Add a botanical essential and it will appear here.</p></div></div>';
    document.querySelectorAll('[data-cart-badge]').forEach(b=>{b.textContent=count;b.classList.toggle('has-items',count>0)});
  }
  function addProduct(id){
    const product = products.find(p=>p.id===id); if(!product) return;
    const item = cart.find(p=>p.id===id); item ? item.qty++ : cart.push({...product,qty:1});
    saveCart(); openPanel('piya-cart');
  }
  function openPanel(id,trigger){
    panels.forEach(p=>p.classList.remove('is-open')); lastTrigger = trigger || document.activeElement;
    document.querySelector(`#${id}`).classList.add('is-open'); scrim.classList.add('is-open'); document.body.classList.add('commerce-locked');
    setTimeout(()=>document.querySelector(`#${id} input, #${id} button`)?.focus(),80);
  }
  function closePanels(){ panels.forEach(p=>p.classList.remove('is-open')); scrim.classList.remove('is-open'); document.body.classList.remove('commerce-locked'); lastTrigger?.focus?.(); }

  document.querySelectorAll('a[href*="/search"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();openPanel('piya-search',a)}));
  document.querySelectorAll('a[href*="/account"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();openPanel('piya-account',a)}));
  document.querySelectorAll('a[href*="/cart"]').forEach(a=>{a.style.position='relative';a.insertAdjacentHTML('beforeend','<span class="cart-count-badge" data-cart-badge></span>');a.addEventListener('click',e=>{e.preventDefault();openPanel('piya-cart',a)})});
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-commerce-close]')) closePanels();
    const add=e.target.closest('[data-add-product]'); if(add) addProduct(add.dataset.addProduct);
    const remove=e.target.closest('[data-cart-remove]'); if(remove){cart=cart.filter(i=>i.id!==remove.dataset.cartRemove);saveCart()}
    const change=e.target.closest('[data-cart-change]'); if(change){const item=cart.find(i=>i.id===change.dataset.cartChange);if(item){item.qty+=Number(change.dataset.delta);if(item.qty<=0)cart=cart.filter(i=>i.id!==item.id);saveCart()}}
    const tab=e.target.closest('[data-account-mode]'); if(tab){const register=tab.dataset.accountMode==='register';document.querySelectorAll('.account-tab').forEach(t=>t.classList.toggle('is-active',t===tab));document.querySelector('.account-name').hidden=!register;document.querySelector('#account-form-title').textContent=register?'Create your account':'Sign in';document.querySelector('#account-form-copy').textContent=register?'Begin a more personal PIYA experience.':'Enter your details to continue your PIYA ritual.';document.querySelector('#account-password').autocomplete=register?'new-password':'current-password'}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanels()});
  searchInput.addEventListener('input',()=>{const q=searchInput.value.trim().toLowerCase();renderProducts(products.filter(p=>`${p.name} ${p.detail}`.toLowerCase().includes(q)))});
  document.querySelector('#account-form').addEventListener('submit',e=>{e.preventDefault();const button=e.currentTarget.querySelector('.account-submit');button.textContent='Welcome to PIYA';setTimeout(closePanels,700)});
  document.querySelector('.cart-checkout').addEventListener('click',()=>{window.location.href='/checkout.html'});
  document.querySelectorAll('.product').forEach((card,index)=>{const button=card.querySelector('.btn');if(!button||!products[index])return;button.textContent='Add to ritual';button.dataset.addProduct=products[index].id;button.addEventListener('click',e=>e.preventDefault())});
  renderProducts(); renderCart();
})();
