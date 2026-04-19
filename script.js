document.addEventListener("DOMContentLoaded", () => {
  const siteContent = {
    brandName: "DB Studios",
    orderSettings: {
      // Use: "demo", "whatsapp", "email", or "api"
      mode: "demo",
      endpoint: "https://example.com/api/orders",
      whatsappNumber: "911234567890",
      email: "orders@dbstudios.com"
    },
    products: [
      {
        id: "db-01",
        title: "Signature Wedding Film",
        category: "Film Package",
        price: 45000,
        description:
          "A cinematic wedding storytelling package with polished editing, highlight moments, and premium delivery.",
        image:
          "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "db-02",
        title: "Luxury Portrait Session",
        category: "Photography",
        price: 18000,
        description:
          "A premium portrait experience ideal for personal branding, fashion, family, or editorial-style shoots.",
        image:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "db-03",
        title: "Premium Photo Album",
        category: "Print Product",
        price: 12000,
        description:
          "Elegant printed albums crafted for clients who want their memories presented in a timeless format.",
        image:
          "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    gallery: [
      {
        title: "DB Studios gallery 1",
        image:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80"
      },
      {
        title: "DB Studios gallery 2",
        image:
          "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80"
      },
      {
        title: "DB Studios gallery 3",
        image:
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80"
      },
      {
        title: "DB Studios gallery 4",
        image:
          "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    videos: [
      {
        title: "Wedding Story Teaser",
        description:
          "Replace this with your own featured film or highlight reel using a direct MP4 link.",
        src: "https://www.w3schools.com/html/mov_bbb.mp4"
      },
      {
        title: "Studio Brand Reel",
        description:
          "Use this section for promotional edits, event trailers, or behind-the-scenes showcase content.",
        src: "https://www.w3schools.com/html/movie.mp4"
      }
    ]
  };

  const state = {
    cart: []
  };

  const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });

  const productGrid = document.getElementById("productGrid");
  const galleryGrid = document.getElementById("galleryGrid");
  const videoList = document.getElementById("videoList");
  const cartButton = document.getElementById("cartButton");
  const cartCount = document.getElementById("cartCount");
  const cartSummary = document.getElementById("cartSummary");
  const orderForm = document.getElementById("orderForm");
  const formNote = document.getElementById("formNote");

  function renderProducts() {
    const template = document.getElementById("productCardTemplate");

    siteContent.products.forEach((product) => {
      const node = template.content.cloneNode(true);
      const media = node.querySelector(".product-media");
      const category = node.querySelector(".product-category");
      const price = node.querySelector(".product-price");
      const title = node.querySelector(".product-title");
      const description = node.querySelector(".product-description");
      const button = node.querySelector(".add-cart");

      media.style.backgroundImage = `linear-gradient(180deg, rgba(30, 52, 45, 0.16), transparent), url("${product.image}")`;
      category.textContent = product.category;
      price.textContent = currencyFormatter.format(product.price);
      title.textContent = product.title;
      description.textContent = product.description;
      button.addEventListener("click", () => addToCart(product.id));

      productGrid.appendChild(node);
    });
  }

  function renderGallery() {
    const template = document.getElementById("galleryItemTemplate");

    siteContent.gallery.forEach((item) => {
      const node = template.content.cloneNode(true);
      const image = node.querySelector("img");
      image.src = item.image;
      image.alt = item.title;
      galleryGrid.appendChild(node);
    });
  }

  function renderVideos() {
    const template = document.getElementById("videoCardTemplate");

    siteContent.videos.forEach((item) => {
      const node = template.content.cloneNode(true);
      const video = node.querySelector("video");
      const title = node.querySelector("h3");
      const description = node.querySelector("p");

      video.src = item.src;
      title.textContent = item.title;
      description.textContent = item.description;
      videoList.appendChild(node);
    });
  }

  function addToCart(productId) {
    const product = siteContent.products.find((entry) => entry.id === productId);
    if (!product) return;

    state.cart.push(product);
    renderCart();
  }

  function renderCart() {
    cartCount.textContent = String(state.cart.length);

    if (!state.cart.length) {
      cartSummary.innerHTML = `
        <h3>Current selection</h3>
        <p>No items selected yet.</p>
      `;
      return;
    }

    const itemsMarkup = state.cart
      .map(
        (item) =>
          `<li>${item.title} <strong>${currencyFormatter.format(item.price)}</strong></li>`
      )
      .join("");

    const total = state.cart.reduce((sum, item) => sum + item.price, 0);

    cartSummary.innerHTML = `
      <h3>Current selection</h3>
      <ul>${itemsMarkup}</ul>
      <p><strong>Total:</strong> ${currencyFormatter.format(total)}</p>
    `;
  }

  function buildOrderPayload(formData) {
    return {
      brand: siteContent.brandName,
      customer: {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        city: formData.get("city")
      },
      notes: formData.get("message"),
      items: state.cart.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price
      })),
      total: state.cart.reduce((sum, item) => sum + item.price, 0),
      submittedAt: new Date().toISOString()
    };
  }

  function formatOrderMessage(payload) {
    const selectedItems = payload.items.length
      ? payload.items
          .map(
            (item, index) =>
              `${index + 1}. ${item.title} - ${currencyFormatter.format(item.price)}`
          )
          .join("\n")
      : "No cart items selected";

    return [
      `New order request for ${payload.brand}`,
      `Name: ${payload.customer.name}`,
      `Email: ${payload.customer.email}`,
      `Phone: ${payload.customer.phone}`,
      `City: ${payload.customer.city}`,
      "",
      "Selected items:",
      selectedItems,
      "",
      `Project details: ${payload.notes || "None"}`,
      `Estimated total: ${currencyFormatter.format(payload.total)}`
    ].join("\n");
  }

  async function handleOrderSubmit(event) {
    event.preventDefault();

    const formData = new FormData(orderForm);
    const payload = buildOrderPayload(formData);
    const message = formatOrderMessage(payload);

    try {
      if (siteContent.orderSettings.mode === "api") {
        const response = await fetch(siteContent.orderSettings.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error("API request failed");
        }

        formNote.className = "form-note status-success";
        formNote.textContent = "Order request sent successfully.";
      } else if (siteContent.orderSettings.mode === "whatsapp") {
        const whatsappUrl = `https://wa.me/${siteContent.orderSettings.whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank", "noopener");
        formNote.className = "form-note status-success";
        formNote.textContent = "WhatsApp order draft opened successfully.";
      } else if (siteContent.orderSettings.mode === "email") {
        const emailUrl = `mailto:${siteContent.orderSettings.email}?subject=${encodeURIComponent(
          `Order request for ${siteContent.brandName}`
        )}&body=${encodeURIComponent(message)}`;
        window.location.href = emailUrl;
        formNote.className = "form-note status-success";
        formNote.textContent = "Email draft opened successfully.";
      } else {
        formNote.className = "form-note status-success";
        formNote.textContent =
          "Demo mode is active. The order summary has been printed in the browser console.";
        console.log(message);
      }

      orderForm.reset();
      state.cart = [];
      renderCart();
    } catch (error) {
      formNote.className = "form-note status-error";
      formNote.textContent =
        "Unable to prepare the order request. Please check the settings in codepen.js.";
      console.error(error);
    }
  }

  cartButton.addEventListener("click", () => {
    document.getElementById("order").scrollIntoView({ behavior: "smooth" });
  });

  orderForm.addEventListener("submit", handleOrderSubmit);

  renderProducts();
  renderGallery();
  renderVideos();
  renderCart();
});

const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("shrink");
  } else {
    navbar.classList.remove("shrink");
  }
});