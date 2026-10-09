(() => {
  const storageKey = 'piya-beauty-cart-v1';
  const fallback = [{id:'glow-set',name:'Glow Turmeric Ritual Set',detail:'Cleanse · Hydrate · Glow',price:89,image:'/piya-glow-ritual-set-v2.png',qty:1}];
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(storageKey)) || []; } catch (_) {}
  if (!cart.length) cart = fallback;
  let promoApplied = false;
  const money = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
  const subtotal = () => cart.reduce((sum,item)=>sum+item.price*item.qty,0);
  const shipping = () => {
    const method = document.querySelector('input[name="shipping"]:checked')?.value || 'standard';
    return method === 'express' ? 14 : subtotal() >= 75 ? 0 : 6;
  };
  function renderSummary(){
    document.querySelector('#summary-items').innerHTML = cart.map(item=>`<article class="summary-item"><img src="${item.image}" alt="${item.name}"><div><h3>${item.name}</h3><p>${item.detail}</p><span class="qty">Qty ${item.qty}</span></div><strong>${money(item.price*item.qty)}</strong></article>`).join('');
    const discount = promoApplied ? subtotal()*.1 : 0;
    const total = subtotal()+shipping()-discount;
    document.querySelector('#summary-subtotal').textContent=money(subtotal());
    document.querySelector('#summary-shipping').textContent=shipping() ? money(shipping()) : 'Free';
    document.querySelector('#summary-discount').textContent=`−${money(discount)}`;
    document.querySelector('.discount-row').hidden=!promoApplied;
    document.querySelector('#summary-total').textContent=money(total);
    document.querySelector('#pay-total').textContent=money(total);
    const standard=document.querySelector('[data-shipping-price="standard"]'); if(standard) standard.textContent=subtotal()>=75?'Free':'$6.00';
  }
  function toast(message){const el=document.querySelector('#checkout-toast');el.textContent=message;el.classList.add('is-visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('is-visible'),2600)}
  document.querySelectorAll('input[name="shipping"]').forEach(input=>input.addEventListener('change',()=>{document.querySelectorAll('.choice').forEach(c=>c.classList.toggle('is-selected',c.contains(input)));renderSummary()}));
  document.querySelectorAll('input[name="payment"]').forEach(input=>input.addEventListener('change',()=>{document.querySelectorAll('.payment-choice').forEach(c=>c.classList.toggle('is-selected',c.contains(input)));document.querySelector('.payment-box').dataset.method=input.value}));
  document.querySelectorAll('[data-wallet]').forEach(button=>button.addEventListener('click',()=>toast(`${button.dataset.wallet} is ready for the live store connection.`)));
  document.querySelector('#apply-promo').addEventListener('click',()=>{const input=document.querySelector('#promo-code');const message=document.querySelector('#promo-message');if(input.value.trim().toUpperCase()==='WELCOME10'){promoApplied=true;message.textContent='WELCOME10 applied — 10% saved.';renderSummary()}else{message.textContent='Try WELCOME10 for 10% off.'}});
  document.querySelector('[data-card-number]').addEventListener('input',event=>{event.target.value=event.target.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()});
  document.querySelector('#checkout-form').addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget;const missing=[...form.querySelectorAll('[required]')].filter(el=>el.type==='checkbox'?!el.checked:!el.value.trim());form.querySelectorAll('.is-error').forEach(el=>el.classList.remove('is-error'));if(missing.length){missing.forEach(el=>el.classList.add('is-error'));missing[0].focus();toast('Please complete the highlighted details.');return}toast('Checkout preview complete — no payment was processed.')});
  document.querySelector('.payment-box').dataset.method='card';
  renderSummary();
})();
