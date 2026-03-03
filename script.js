(function () {
  const toBRL = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // modal elements
  const modal = document.getElementById("product-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalDesc = document.getElementById("modal-desc");
  const modalPrice = document.getElementById("modal-price");
  const addToCartBtn = document.getElementById("add-to-cart");
  const modalSize = document.getElementById("modal-size");
  const modalColor = document.getElementById("modal-color");

  // cart elements
  const cartButton = document.getElementById("cart-button");
  const cartCount = document.getElementById("cart-count");
  const cartDrawer = document.getElementById("cart-drawer");
  const cartBackdrop = document.getElementById("cart-backdrop");
  const cartItemsEl = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");
  const closeCartBtn = document.getElementById("close-cart");
  const checkoutBtn = document.getElementById("checkout");

  let currentProduct = null;
  const cart = [];

  // abrir modal com dados do card
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-detail");
    if (btn) {
      const card = btn.closest(".card");
      openModalFromCard(card);
    }
  });

  function openModalFromCard(card) {
    const id = card.dataset.id;
    const name = card.dataset.name;
    const price = Number(card.dataset.price || 0);
    const desc = card.dataset.desc || "";
    currentProduct = { id, name, price, desc };
    modalTitle.textContent = name;
    modalDesc.textContent = desc;
    modalPrice.textContent = toBRL(price);
    // reset options to defaults
    if (modalSize) modalSize.value = "M";
    if (modalColor) modalColor.value = "azul";
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  // fechar modal
  document.querySelectorAll(".modal-close, .modal-backdrop").forEach((el) => {
    el.addEventListener("click", () => closeModal());
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  function closeModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    currentProduct = null;
  }

  // adicionar ao carrinho
  addToCartBtn.addEventListener("click", () => {
    if (!currentProduct) return;
    const size = modalSize ? modalSize.value : null;
    const color = modalColor ? modalColor.value : null;
    addToCart(currentProduct, { size, color });
    closeModal();
    openCart();
  });

  function addToCart(prod, opts = {}) {
    const key = `${prod.id}::${opts.size || ""}::${opts.color || ""}`;
    const existing = cart.find((i) => i.key === key);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        ...prod,
        qty: 1,
        size: opts.size || null,
        color: opts.color || null,
        key,
      });
    }
    renderCart();
  }

  function renderCart() {
    // atualizar badge e lista
    const count = cart.reduce((s, i) => s + i.qty, 0);
    cartCount.textContent = String(count);
    if (cart.length === 0) {
      cartItemsEl.innerHTML = '<p class="muted">Carrinho vazio</p>';
      cartTotalEl.textContent = toBRL(0);
      return;
    }
    cartItemsEl.innerHTML = "";
    let total = 0;
    cart.forEach((item) => {
      total += item.price * item.qty;
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="meta">
          <strong>${item.name}</strong>
          <small>${toBRL(item.price)} x ${item.qty} ${item.size ? ` • Tamanho: ${item.size}` : ""} ${item.color ? ` • Cor: ${item.color}` : ""}</small>
        </div>
        <div>
          <button class="btn btn-sm btn-remove" data-key="${item.key}">Remover</button>
        </div>
      `;
      cartItemsEl.appendChild(row);
    });
    cartTotalEl.textContent = toBRL(total);
  }

  // remover item
  cartItemsEl.addEventListener("click", (e) => {
    const rem = e.target.closest(".btn-remove");
    if (!rem) return;
    const key = rem.dataset.key;
    const idx = cart.findIndex((i) => i.key === key);
    if (idx > -1) cart.splice(idx, 1);
    renderCart();
  });

  // abrir/fechar cart (toggle ao clicar no botão do header)
  cartButton.addEventListener("click", () => {
    if (cartDrawer.classList.contains("hidden")) openCart();
    else closeCart();
  });
  closeCartBtn.addEventListener("click", closeCart);
  cartBackdrop.addEventListener("click", closeCart);

  function openCart() {
    cartDrawer.classList.remove("hidden");
    cartDrawer.setAttribute("aria-hidden", "false");
    cartDrawer.classList.add("is-open");
    cartButton.classList.add("cart-open");
    cartBackdrop.classList.remove("hidden");
    cartBackdrop.setAttribute("aria-hidden", "false");
    renderCart();
  }
  function closeCart() {
    cartDrawer.classList.remove("is-open");
    cartDrawer.classList.add("hidden");
    cartDrawer.setAttribute("aria-hidden", "true");
    cartButton.classList.remove("cart-open");
    cartBackdrop.classList.add("hidden");
    cartBackdrop.setAttribute("aria-hidden", "true");
  }

  // checkout simulado
  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }
    alert("Compra simulada! Total: " + cartTotalEl.textContent);
    cart.length = 0;
    renderCart();
    closeCart();
  });

  // init
  renderCart();
})();
