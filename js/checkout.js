/*
 * checkout.js
 * Checkout validation, live order summary rendering, and order confirmation
 * for MiniMart.
 *
 * Reads cart state from window.MiniMartStore (bridged by main.js) or `cart`,
 * renders #order-items and #order-total, validates delivery fields, and
 * dispatches "order-placed" with full order details for the summary screen.
 */

"use strict";

(function () {
  const checkoutForm = document.getElementById("checkout-form");
  const orderItemsList = document.getElementById("order-items");
  const orderTotalEl = document.getElementById("order-total");
  const checkoutEmptyEl = document.getElementById("checkout-empty");
  const checkoutMessageEl = document.getElementById("checkout-message");
  const placeOrderBtn = document.getElementById("place-order");

  const fields = {
    fullName: {
      input: document.getElementById("fullName"),
      error: document.getElementById("fullName-error"),
      validate(value) {
        if (!value.trim()) return "Please enter your full name.";
        if (value.trim().length < 2) return "Name must be at least 2 characters.";
        return "";
      }
    },
    email: {
      input: document.getElementById("email"),
      error: document.getElementById("email-error"),
      validate(value) {
        const trimmed = value.trim();
        if (!trimmed) return "Please enter your email address.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          return "Please enter a valid email address.";
        }
        return "";
      }
    },
    phone: {
      input: document.getElementById("phone"),
      error: document.getElementById("phone-error"),
      validate(value) {
        const digits = value.replace(/\D/g, "");
        if (!value.trim()) return "Please enter your phone number.";
        if (digits.length < 7) return "Please enter a valid phone number.";
        return "";
      }
    },
    address: {
      input: document.getElementById("address"),
      error: document.getElementById("address-error"),
      validate(value) {
        if (!value.trim()) return "Please enter your delivery address.";
        if (value.trim().length < 5) return "Please enter a complete delivery address.";
        return "";
      }
    }
  };

  function getCartSnapshot() {
    if (window.MiniMartStore && typeof window.MiniMartStore.getItems === "function") {
      return {
        items: window.MiniMartStore.getItems(),
        total: window.MiniMartStore.getTotal()
      };
    }
    if (typeof cart !== "undefined") {
      return {
        items: cart.getItems(),
        total: cart.getTotal()
      };
    }
    return { items: [], total: 0 };
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  }

  function renderCheckoutSummary() {
    if (!orderItemsList || !orderTotalEl) return;

    const { items, total } = getCartSnapshot();
    orderItemsList.replaceChildren();

    if (items.length === 0) {
      if (checkoutEmptyEl) checkoutEmptyEl.hidden = false;
      if (placeOrderBtn) placeOrderBtn.disabled = true;
      orderTotalEl.textContent = formatCurrency(0);
      return;
    }

    if (checkoutEmptyEl) checkoutEmptyEl.hidden = true;
    if (placeOrderBtn) placeOrderBtn.disabled = false;

    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "summary-item";

      const nameSpan = document.createElement("span");
      nameSpan.className = "summary-item__name";
      nameSpan.textContent = `${item.quantity} × ${item.title}`;

      const priceSpan = document.createElement("span");
      priceSpan.className = "summary-item__price";
      priceSpan.textContent = formatCurrency(item.price * item.quantity);

      li.append(nameSpan, priceSpan);
      orderItemsList.append(li);
    });

    orderTotalEl.textContent = formatCurrency(total);
  }

  function validateField(key) {
    const field = fields[key];
    if (!field || !field.input || !field.error) return true;

    const message = field.validate(field.input.value);
    field.error.textContent = message;
    field.input.classList.toggle("invalid", Boolean(message));
    return !message;
  }

  function validateAllFields() {
    let allValid = true;
    Object.keys(fields).forEach((key) => {
      if (!validateField(key)) {
        allValid = false;
      }
    });
    return allValid;
  }

  function setFormMessage(text, type) {
    if (!checkoutMessageEl) return;
    checkoutMessageEl.textContent = text;
    checkoutMessageEl.className = "form-message" + (type ? ` ${type}` : "");
  }

  // Real-time validation on blur and input
  Object.keys(fields).forEach((key) => {
    const field = fields[key];
    if (!field.input) return;

    field.input.addEventListener("blur", () => validateField(key));
    field.input.addEventListener("input", () => {
      if (field.input.classList.contains("invalid")) {
        validateField(key);
      }
    });
  });

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (event) => {
      event.preventDefault();
      setFormMessage("", "");

      const { items, total } = getCartSnapshot();
      if (items.length === 0) {
        setFormMessage("Your cart is empty. Add items before placing an order.", "error");
        return;
      }

      if (!validateAllFields()) {
        setFormMessage("Please fix the highlighted errors above before placing your order.", "error");
        const firstInvalid = checkoutForm.querySelector(".invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const orderData = {
        orderId: "MM-" + Math.floor(100000 + Math.random() * 900000),
        placedAt: new Date().toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short"
        }),
        customer: {
          fullName: fields.fullName.input.value.trim(),
          email: fields.email.input.value.trim(),
          phone: fields.phone.input.value.trim(),
          address: fields.address.input.value.trim()
        },
        items,
        total
      };

      setFormMessage("Order placed successfully!", "success");

      // Clear form inputs and validation state
      checkoutForm.reset();
      Object.keys(fields).forEach((key) => {
        if (fields[key].input) fields[key].input.classList.remove("invalid");
        if (fields[key].error) fields[key].error.textContent = "";
      });

      // Clear shared cart
      if (window.MiniMartStore && typeof window.MiniMartStore.clear === "function") {
        window.MiniMartStore.clear();
      } else if (typeof cart !== "undefined") {
        cart.clear();
      }

      // Notify main.js so it can switch to the Order Summary / Confirmation view
      document.dispatchEvent(
        new CustomEvent("order-placed", {
          detail: orderData
        })
      );
    });
  }

  // Keep summary synchronized whenever cart updates or checkout view opens
  document.addEventListener("cart-updated", renderCheckoutSummary);
  document.addEventListener("checkout-requested", renderCheckoutSummary);
  document.addEventListener("view-changed", (event) => {
    if (event.detail && event.detail.view === "checkout") {
      setFormMessage("", "");
      renderCheckoutSummary();
    }
  });

  // Expose helper for main.js
  window.CheckoutModule = {
    renderSummary: renderCheckoutSummary
  };

  renderCheckoutSummary();
})();
