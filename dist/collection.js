(() => {
  const key='piya-beauty-cart-v1';
  document.querySelectorAll('.collection-add').forEach(button=>button.addEventListener('click',()=>{
    const card=button.closest('.collection-card');
    const product={id:card.dataset.id,name:card.dataset.name,detail:card.dataset.detail,price:Number(card.dataset.price),image:card.dataset.image,qty:1};
    let cart=[];try{cart=JSON.parse(localStorage.getItem(key))||[]}catch(_){}
    const current=cart.find(item=>item.id===product.id);current?current.qty++:cart.push(product);localStorage.setItem(key,JSON.stringify(cart));
    button.textContent='Added to your ritual';setTimeout(()=>{document.querySelector('a[href*="/cart"]')?.click();button.textContent='Add to ritual'},450);
  }));
})();
