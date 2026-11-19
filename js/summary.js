/*
 * summary.js - Member 4: Integration and Summary
 * Owns: Order summary screen, latest order localStorage, Continue Shopping logic
 *
 * Requirements met:
 * - Order summary screen showing order ID, customer details, items, and total
 * - "Continue Shopping" button that clears cart and returns to product list
 * - Save latest order in localStorage (minimart_last_order_v1)
 * - Works with main.js view router via "order-placed" and "view-changed" events
 */

"use strict";

(function () {
  const ORDER_STORAGE_KEY = "minimart_last_order_v1";
  const CART_STORAGE_KEY = "minimart_cart_v1";

  const summaryContainer = document.getElementById("order-confirmation-details");

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  }

  // Requirement: Save latest order in localStorage
  function saveOrder(orderData) {
    try {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orderData));
    } catch (err) {
      console.warn("Could not save order:", err);
    }
  }

  function loadLastOrder() {
    try {
      const raw = localStorage.getItem(ORDER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function clearCartStorage() {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  }

  // Requirement: Order summary screen showing order ID, customer details, items, and total
  function renderOrderSummary(orderData) {
    if (!summaryContainer || !orderData) return;

    summaryContainer.replaceChildren();

    const card = document.createElement("div");
    card.className = "order-confirmation-card";
    card.style.cssText = "background:#fff;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.06);";

    const badge = document.createElement("div");
    badge.className = "confirmation-badge";
    badge.textContent = `Order Confirmed • ${orderData.orderId}`;
    badge.style.cssText = "background:#e6fcf5;color:#087f5b;padding:8px 14px;border-radius:999px;display:inline-block;font-weight:700;font-size:13px;margin-bottom:18px;letter-spacing:0.2px;";

    const heading = document.createElement("h1");
    heading.className = "page-title";
    heading.textContent = `Thank you, ${orderData.customer.fullName}!`;
    heading.style.cssText = "margin:0 0 8px;font-size:28px;";

    const subtitle = document.createElement("p");
    subtitle.textContent = "Your order has been received and is being prepared for dispatch. Below is your order summary.";
    subtitle.style.cssText = "color:#4c535e;margin:0 0 22px;line-height:1.5;";

    const meta = document.createElement("div");
    meta.className = "confirmation-meta";
    meta.style.cssText = "background:#f8f9fa;padding:18px;border-radius:12px;margin-bottom:22px;line-height:1.9;font-size:14px;";

    const dateValue = orderData.placedAt || orderData.date || new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

    [
      ["Order Reference", orderData.orderId],
      ["Date", dateValue],
      ["Name", orderData.customer.fullName || orderData.customer.name],
      ["Email", orderData.customer.email],
      ["Phone", orderData.customer.phone],
      ["Delivery Address", orderData.customer.address]
    ].forEach(([label, val]) => {
      const p = document.createElement("p");
      p.style.margin = "4px 0";
      const strong = document.createElement("strong");
      strong.textContent = `${label}: `;
      p.append(strong, document.createTextNode(val || ""));
      meta.append(p);
    });

    const itemsTitle = document.createElement("h2");
    itemsTitle.className = "card__title";
    itemsTitle.textContent = "Items Ordered";
    itemsTitle.style.cssText = "font-size:18px;margin:0 0 8px;";

    const list = document.createElement("ul");
    list.className = "summary-list";
    list.style.cssText = "list-style:none;padding:0;margin:0 0 8px;";

    orderData.items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "summary-item";
      li.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #eef0f2;";

      const name = document.createElement("span");
      name.className = "summary-item__name";
      name.textContent = `${item.quantity} × ${item.title}`;
      name.style.cssText = "color:#212529;";

      const price = document.createElement("span");
      price.className = "summary-item__price";
      price.style.cssText = "font-weight:600;";
      price.textContent = formatCurrency(item.price * item.quantity);

      li.append(name, price);
      list.append(li);
    });

    const totalRow = document.createElement("div");
    totalRow.className = "summary-total";
    totalRow.style.cssText = "display:flex;justify-content:space-between;font-weight:700;font-size:18px;margin:18px 0 26px;padding-top:12px;border-top:2px solid #212529;";

    const totalLabel = document.createElement("span");
    totalLabel.textContent = "Total Paid";
    const totalVal = document.createElement("span");
    totalVal.textContent = formatCurrency(orderData.total);

    totalRow.append(totalLabel, totalVal);

    // Requirement: Continue Shopping button clears cart and returns to products
    const actionBtn = document.createElement("button");
    actionBtn.type = "button";
    actionBtn.className = "btn-primary";
    actionBtn.textContent = "Continue Shopping";
    actionBtn.style.cssText = "width:100%;height:48px;background:#d9480f;color:#fff;border:0;border-radius:10px;font-weight:600;cursor:pointer;font-size:15px;";
    actionBtn.addEventListener("click", handleContinueShopping);

    card.append(badge, heading, subtitle, meta, itemsTitle, list, totalRow, actionBtn);
    summaryContainer.append(card);
  }

  function renderEmptyState() {
    if (!summaryContainer) return;
    summaryContainer.replaceChildren();
    const card = document.createElement("div");
    card.className = "order-confirmation-card";
    card.style.cssText = "background:#fff;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.06);text-align:center;";
    card.innerHTML = `
      <h1 class="page-title" style="margin:0 0 8px;">Order Summary</h1>
      <p style="color:#4c535e;margin-bottom:20px;">No recent order found. Complete checkout to view your order summary here.</p>
      <button type="button" class="btn-primary" id="continue-shopping-empty" style="width:100%;height:48px;background:#d9480f;color:#fff;border:0;border-radius:10px;font-weight:600;cursor:pointer;">
        Browse Products
      </button>
    `;
    summaryContainer.append(card);
    card.querySelector("#continue-shopping-empty").addEventListener("click", () => {
      if (window.MiniMartApp) window.MiniMartApp.switchView("products");
    });
  }

  // Requirement: Continue Shopping clears cart and returns to product list
  function handleContinueShopping() {
    // 1. Clear in-memory cart
    if (window.MiniMartStore && typeof window.MiniMartStore.clear === "function") {
      window.MiniMartStore.clear();
    } else if (typeof cart !== "undefined") {
      cart.clear();
    }
    // 2. Clear cart storage so refresh stays empty
    clearCartStorage();

    // 3. Do NOT clear order storage - we keep latest order for history / stretch goal
    // 4. Return to products
    if (window.MiniMartApp && window.MiniMartApp.switchView) {
      window.MiniMartApp.switchView("products");
    }
  }

  // Listen for order-placed from Member 3
  document.addEventListener("order-placed", (event) => {
    const orderData = event.detail;
    if (!orderData) return;

    // Ensure date exists (Order object requirement)
    if (!orderData.placedAt && !orderData.date) {
      orderData.placedAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
    }
    if (!orderData.date) {
      orderData.date = new Date().toISOString();
    }

    // FIX 1: Save latest order in localStorage
    saveOrder(orderData);
    renderOrderSummary(orderData);
  });

  // Restore last order if user refreshes on summary view
  document.addEventListener("view-changed", (event) => {
    if (event.detail && event.detail.view === "summary") {
      const lastOrder = loadLastOrder();
      // If summary is empty (e.g. after refresh) and we have a saved order, show it
      if (lastOrder && summaryContainer && summaryContainer.children.length === 0) {
        renderOrderSummary(lastOrder);
      } else if (!lastOrder && summaryContainer && summaryContainer.children.length === 0) {
        renderEmptyState();
      } else if (!lastOrder) {
        // If user goes to summary without ordering, show empty
        const hasOrderBadge = summaryContainer.querySelector(".confirmation-badge");
        if (!hasOrderBadge) {
          // Check if it's the initial static HTML - replace with proper empty
          const last = loadLastOrder();
          if (!last) renderEmptyState();
        }
      }
    }
  });

  // Expose for main.js and for demo / testing
  window.SummaryModule = {
    renderOrderSummary,
    renderEmptyState,
    loadLastOrder,
    saveOrder,
    handleContinueShopping,
    ORDER_STORAGE_KEY,
    CART_STORAGE_KEY
  };
})();
