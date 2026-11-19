/*
 * main.js - Member 4: Integration and Summary
 * Owns: Page layout, navigation between views, cart localStorage, app glue
 * Does NOT own: summary rendering (that is summary.js)
 *
 * Responsibilities:
 * 1. Bridges cart to window.MiniMartStore for cross-module access
 * 2. Saves / restores cart from localStorage (Requirement: cart survives refresh)
 * 3. Manages view switching between products / checkout / summary
 * 4. Keeps header navigation active states
 */

"use strict";

(function () {
  const CART_STORAGE_KEY = "minimart_cart_v1";

  // 1. Bridge shared cart store for cross-module access
  // This allows products.js, checkout.js, summary.js to read cart without importing cart.js directly
  window.MiniMartStore = {
    getItems() {
      return typeof cart !== "undefined" ? cart.getItems() : [];
    },
    getTotal() {
      return typeof cart !== "undefined" ? cart.getTotal() : 0;
    },
    getItemCount() {
      return typeof cart !== "undefined" ? cart.getItemCount() : 0;
    },
    clear() {
      if (typeof cart !== "undefined") cart.clear();
    },
    setItems(items) {
      if (typeof cart !== "undefined") cart.setItems(items);
    }
  };

  // 2. Restore saved cart from localStorage on startup - Requirement
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Wait until cart is defined (cart.js is deferred, so it should be)
        const restore = () => {
          if (typeof cart !== "undefined") {
            cart.setItems(parsed);
          } else {
            setTimeout(restore, 50);
          }
        };
        restore();
      }
    }
  } catch (err) {
    console.warn("Could not restore saved cart:", err);
  }

  // Save cart to localStorage whenever it changes - Requirement
  document.addEventListener("cart-updated", (event) => {
    try {
      const items = event.detail ? event.detail.items : window.MiniMartStore.getItems();
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn("Could not save cart:", err);
    }
  });

  // 3. View Switching Controller - Requirement: Page layout and navigation
  const views = {
    products: document.getElementById("products-view"),
    checkout: document.getElementById("checkout-view"),
    summary: document.getElementById("summary-view")
  };

  const navProductsLink = document.getElementById("nav-products");
  const navCheckoutLink = document.getElementById("nav-checkout");
  const brandLogoLink = document.getElementById("brand-logo");
  const backToProductsBtn = document.getElementById("back-to-products");
  const continueShoppingBtn = document.getElementById("continue-shopping-btn"); // fallback in static HTML

  function switchView(targetView) {
    if (!views[targetView]) return;

    Object.entries(views).forEach(([name, section]) => {
      const isTarget = name === targetView;
      section.hidden = !isTarget;
      section.setAttribute("aria-hidden", String(!isTarget));
    });

    // Update active state on header navigation
    if (navProductsLink) {
      const active = targetView === "products";
      navProductsLink.classList.toggle("is-active", active);
      if (active) {
        navProductsLink.setAttribute("aria-current", "page");
      } else {
        navProductsLink.removeAttribute("aria-current");
      }
    }

    if (navCheckoutLink) {
      const active = targetView === "checkout";
      navCheckoutLink.classList.toggle("is-active", active);
      if (active) {
        navCheckoutLink.setAttribute("aria-current", "page");
      } else {
        navCheckoutLink.removeAttribute("aria-current");
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    document.dispatchEvent(
      new CustomEvent("view-changed", {
        detail: { view: targetView }
      })
    );
  }

  // 4. Wire up navigation events
  if (brandLogoLink) {
    brandLogoLink.addEventListener("click", (e) => {
      e.preventDefault();
      switchView("products");
    });
  }

  if (navProductsLink) {
    navProductsLink.addEventListener("click", (e) => {
      e.preventDefault();
      switchView("products");
    });
  }

  if (navCheckoutLink) {
    navCheckoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      switchView("checkout");
    });
  }

  if (backToProductsBtn) {
    backToProductsBtn.addEventListener("click", () => {
      switchView("products");
    });
  }

  // Fallback button that exists in the initial static summary HTML before summary.js renders
  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener("click", () => {
      switchView("products");
    });
  }

  // Triggered by cart.js when user clicks "Checkout" inside the slide-over cart
  document.addEventListener("checkout-requested", () => {
    switchView("checkout");
  });

  // Triggered by checkout.js when order passes validation
  // Saving + rendering is owned by summary.js (SummaryModule)
  document.addEventListener("order-placed", () => {
    switchView("summary");
  });

  // Expose router globally for other modules and for demo
  window.MiniMartApp = {
    switchView,
    CART_STORAGE_KEY
  };

  // Start on the Products view
  switchView("products");
})();
