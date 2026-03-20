(function () {
  // ========== CONFIGURAÇÃO GLOBAL DE IMAGENS ==========
  // Padrão: Proporção 3:4 (vertical)
  // Desktop: 600x800px recomendado
  // Mobile: aspect-ratio 1:1
  // Performance: JPG 80% qualidade, máx 150kb
  
  /**
   * Aplica padrões de qualidade em uma imagem
   * - Lazy loading para performance
   * - Fallback para placeholder
   * - Classe carousel-item se viável
   * @param {HTMLImageElement} img - Elemento img a ser configurado
   */
  function applyImageQualityStandards(img) {
    // 1. LAZY LOADING - Melhora performance ao não carregar imagens invisíveis
    if (!img.hasAttribute('loading')) {
      img.loading = 'lazy';
    }
    
    // 2. FALLBACK - Garantir que imagem quebrada mostre placeholder
    if (!img.onerror) {
      img.onerror = function() {
        this.src = 'imgs/placeholder.jpg';
        this.onerror = function() {
          this.style.opacity = '0.5';
          this.style.backgroundColor = '#f3f4f6';
        };
      };
    }
  }
  
  const toBRL = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // --- Elements ---
  const modal = document.getElementById("product-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalDesc = document.getElementById("modal-desc");
  const modalPrice = document.getElementById("modal-price");
  const modalMedia = document.getElementById("modal-media");
  const addToCartBtn = document.getElementById("add-to-cart");
  const modalSize = document.getElementById("modal-size");
  const modalColor = document.getElementById("modal-color");

  const cartButton = document.getElementById("cart-button");
  const cartCount = document.getElementById("cart-count");
  const cartDrawer = document.getElementById("cart-drawer");
  const cartBackdrop = document.getElementById("cart-backdrop");
  const cartItemsEl = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");
  const closeCartBtn = document.getElementById("close-cart");
  const checkoutBtn = document.getElementById("checkout");

  let currentProduct = null;
  let expandedCard = null;
  const cart = [];

  function createCarousel(container, images, productName) {
    if (!container || !images || !images.length) return;

    container.innerHTML = `
      <div class="card-carousel" aria-label="Carrossel de imagens do produto">
        <button type="button" class="carousel-btn carousel-btn--prev" aria-label="Imagem anterior">◀</button>
        <div class="carousel-track" aria-live="polite"></div>
        <button type="button" class="carousel-btn carousel-btn--next" aria-label="Próxima imagem">▶</button>
      </div>
    `;

    const track = container.querySelector(".carousel-track");

    // ========== CONTROLE DE QUALIDADE DE IMAGENS ==========
    // Aplicar configurações padrão a todas as imagens do carrossel
    images.forEach((src, idx) => {
      const img = document.createElement("img");
      
      // Configurar source da imagem
      img.src = src;
      img.alt = `${productName || "Produto"} - imagem ${idx + 1}`;
      
      // 1. APLICAR CLASSE PADRÃO AUTOMATICAMENTE
      img.classList.add("carousel-item");
      
      // 2. LAZY LOADING - Melhorar performance
      img.loading = "lazy";
      
      // 3. FALLBACK - Se a imagem não carregar, usar placeholder
      img.onerror = function() {
        this.src = "imgs/placeholder.jpg";
        // Se o placeholder também falhar, exibir mensagem
        this.onerror = function() {
          this.style.display = "none";
          if (track.querySelector(".error-message") === null) {
            const error = document.createElement("div");
            error.className = "error-message";
            error.textContent = "Imagem não disponível";
            error.style.cssText = "width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--muted);";
            track.appendChild(error);
          }
        };
      };
      
      track.appendChild(img);
    });

    let currentIndex = 0;

    function updateCarousel() {
      track.style.transform = `translateX(${-currentIndex * 100}%)`;
      track.setAttribute(
        "aria-label",
        `Imagem ${currentIndex + 1} de ${images.length}`,
      );
    }

    const prevBtn = container.querySelector(".carousel-btn--prev");
    const nextBtn = container.querySelector(".carousel-btn--next");

    prevBtn.addEventListener("click", () => {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      updateCarousel();
    });

    nextBtn.addEventListener("click", () => {
      currentIndex = (currentIndex + 1) % images.length;
      updateCarousel();
    });

    updateCarousel();
  }

  // --- Card carousel ---
  function initCardCarousels() {
    document.querySelectorAll(".card").forEach((card) => {
      const imagesData = card.dataset.images;
      if (!imagesData) return;

      const images = imagesData
        .split(",")
        .map((src) => src.trim())
        .filter(Boolean);

      if (images.length === 0) return;

      const media = card.querySelector(".card-media");
      if (!media) return;

      createCarousel(media, images, card.dataset.name);
    });
    
    // Aplicar padrões de qualidade em TODAS as imagens criadas
    document.querySelectorAll('img').forEach(img => {
      applyImageQualityStandards(img);
    });
  }

  // --- Modal logic ---
  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".btn-add-cart");
    if (addBtn) {
      const card = addBtn.closest(".card");
      if (!card) return;
      const id = card.dataset.id || "";
      const titleEl = card.querySelector(".card-title");
      const descEl = card.querySelector(".card-desc");
      const name = card.dataset.name || (titleEl ? titleEl.textContent : "");
      const price = Number(card.dataset.price || 0);
      const desc = card.dataset.desc || (descEl ? descEl.textContent : "");
      const prod = { id, name, price, desc };
      adicionarAoCarrinho(prod, {});
      openCart();
      return;
    }

    const media = e.target.closest(".card-media");
    if (media && !e.target.closest(".carousel-btn")) {
      const card = media.closest(".card");
      if (card) openModalFromCard(card);
      return;
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

    const imagesData = card.dataset.images;
    const images = imagesData
      ? imagesData
          .split(",")
          .map((src) => src.trim())
          .filter(Boolean)
      : [];

    if (images.length) {
      createCarousel(modalMedia, images, name);
    } else if (modalMedia) {
      modalMedia.textContent = "Imagem não disponível";
    }

    if (modalSize) modalSize.value = "M";
    if (modalColor) modalColor.value = "azul";

    expandedCard = card;
    card.classList.add("is-expanded");

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    currentProduct = null;
    if (expandedCard) {
      expandedCard.classList.remove("is-expanded");
      expandedCard = null;
    }
  }

  document.querySelectorAll(".modal-close, .modal-backdrop").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      if (!currentProduct) return;
      const size = modalSize ? modalSize.value : null;
      const color = modalColor ? modalColor.value : null;
      adicionarAoCarrinho(currentProduct, { size, color });
      closeModal();
      openCart();
    });
  }

  // --- Cart logic ---
  function adicionarAoCarrinho(prod, opts = {}) {
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

  cartItemsEl.addEventListener("click", (e) => {
    const rem = e.target.closest(".btn-remove");
    if (!rem) return;
    const key = rem.dataset.key;
    const idx = cart.findIndex((i) => i.key === key);
    if (idx > -1) cart.splice(idx, 1);
    renderCart();
  });

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

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      if (cart.length === 0) {
        alert("Seu carrinho está vazio.");
        return;
      }
      const total = cart.reduce(
        (s, i) => s + (Number(i.price) || 0) * (i.qty || 1),
        0,
      );
      if (total == null || isNaN(total) || total <= 0) {
        alert("Valor do pedido inválido.");
        return;
      }
      sendToWhatsapp();
      alert("Compra simulada! Total: " + toBRL(total));
      cart.length = 0;
      renderCart();
      closeCart();
    });
  }

  function sendToWhatsapp() {
    if (!cart || cart.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }
    const phone = "558592463128";
    let total = 0;
    let mensagem = "Olá, gostaria de fazer um pedido:\n";
    cart.forEach((item) => {
      total += item.price * item.qty;
      let line = `${item.qty}x ${item.name}`;
      if (item.size) line += ` • Tamanho: ${item.size}`;
      if (item.color) line += ` • Cor: ${item.color}`;
      line += ` • ${toBRL(item.price)}`;
      mensagem += line + "\n";
    });
    mensagem += `\nTotal: ${toBRL(total)}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
  }

  // --- Filters ---
  const filterCategory = document.getElementById("filter-category");
  const filterPrice = document.getElementById("filter-price");
  const searchInput = document.getElementById("search-input");

  function applyFilters() {
    const category = filterCategory ? filterCategory.value : "Todas";
    const price = filterPrice ? filterPrice.value : "Todos";
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

    document.querySelectorAll(".card").forEach((card) => {
      const cardCategory = card.dataset.category || "";
      const cardPrice = Number(card.dataset.price || 0);
      const cardName = (card.dataset.name || "").toLowerCase();
      const cardDesc = (card.dataset.desc || "").toLowerCase();

      const matchesCategory = category === "Todas" || cardCategory === category;

      let matchesPrice = true;
      if (price === "R$ 0 - R$ 100") {
        matchesPrice = cardPrice >= 0 && cardPrice <= 100;
      } else if (price === "R$ 100 - R$ 500") {
        matchesPrice = cardPrice >= 100 && cardPrice <= 500;
      }

      const matchesSearch =
        query === "" || cardName.includes(query) || cardDesc.includes(query);

      card.style.display =
        matchesCategory && matchesPrice && matchesSearch ? "" : "none";
    });
  }

  if (filterCategory) filterCategory.addEventListener("change", applyFilters);
  if (filterPrice) filterPrice.addEventListener("change", applyFilters);
  if (searchInput) searchInput.addEventListener("input", applyFilters);

  // --- Reset page when clicking logo ---
  const logoReset = document.getElementById("logo-reset");
  if (logoReset) {
    logoReset.style.cursor = "pointer";
    logoReset.addEventListener("click", () => {
      // Reset filters
      if (filterCategory) filterCategory.value = "Todas";
      if (filterPrice) filterPrice.value = "Todos";
      if (searchInput) searchInput.value = "";
      // Close modal and cart
      closeModal();
      closeCart();
      // Apply filters to show all products
      applyFilters();
      // Scroll to top
      window.scrollTo(0, 0);
    });
  }

  // --- Init ---
  initCardCarousels();
  renderCart();
  applyFilters();
})();
