// Using utah sales tax 7.25%
const TAX_RATE = 0.0725;

const pizzas = [
  {
    id: 1,
    name: "Margherita Classic",
    description: "San Marzano tomato, fresh mozzarella, basil.",
    basePrice: 11.5,
    special: false,
  },
  {
    id: 2,
    name: "Pepperoni Supreme",
    description: "Natural pepperoni, mozzarella, signature red sauce.",
    basePrice: 12.5,
    special: false,
  },
  {
    id: 3,
    name: "BBQ Chicken",
    description: "BBQ chicken, red onion, cilantro, BBQ sauce.",
    basePrice: 13.25,
    special: false,
  },
  {
    id: 4,
    name: "Veggie Garden",
    description: "Bell peppers, red onion, mushroom, olive, tomato.",
    basePrice: 12,
    special: false,
  },
  {
    id: 5,
    name: "Four Cheese Fusion",
    description: "Mozzarella, provolone, parmesan, ricotta cream.",
    basePrice: 13,
    special: false,
  },
  {
    id: 6,
    name: "Spicy Hawaiian",
    description: "Pineapple, smoked ham, jalapeño, chili honey drizzle.",
    basePrice: 12.75,
    special: false,
  },
  {
    id: 7,
    name: "Truffle Mushroom Special",
    description: "Chef special: roasted mushroom, truffle cream, arugula.",
    basePrice: 14.25,
    special: true,
  },
  {
    id: 8,
    name: "Steakhouse Supreme Special",
    description: "Chef special: sirloin, caramelized onion, gorgonzola.",
    basePrice: 14.75,
    special: true,
  },
];

// this changes price when bigger pizzas are selected
const sizeOptions = [
  { label: 'Small (10")', multiplier: 1 },
  { label: 'Medium (12")', multiplier: 1.25 },
  { label: 'Large (14")', multiplier: 1.5 },
];

// Crust options
const crustOptions = [
  { label: "Traditional", addOn: 0 },
  { label: "Thin Crust", addOn: 1.0 },
  { label: "Stuffed Crust", addOn: 2.25 },
  { label: "Gluten-Friendly", addOn: 2.0 },
];

// Topping options are the same for all pizzas for simplicity
const toppingOptions = [
  { label: "Pepperoni", price: 1.5 },
  { label: "Italian Sausage", price: 1.5 },
  { label: "Mushroom", price: 1.0 },
  { label: "Onion", price: 0.75 },
  { label: "Bell Pepper", price: 0.75 },
  { label: "Black Olive", price: 1.0 },
  { label: "Extra Cheese", price: 1.5 },
  { label: "Jalapeño", price: 0.75 },
];

// a couple code options for discounts
const discountCodes = {
  PIZZA10: { type: "percent", value: 0.1, label: "10% off" },
  FAMILY5: { type: "flat", value: 5, label: "$5 off" },
};
const state = {
  cart: [],
  appliedDiscount: null,
};

const pizzaList = document.getElementById("pizza-list");
const specialsList = document.getElementById("specials-list");
const cartItems = document.getElementById("cart-items");
const subtotalEl = document.getElementById("subtotal");
const discountEl = document.getElementById("discount");
const taxEl = document.getElementById("tax");
const totalEl = document.getElementById("total");
const discountCodeInput = document.getElementById("discount-code");
const discountMessage = document.getElementById("discount-message");

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function makePizzaCard(pizza) {
  const template = document.getElementById("pizza-template");
  const node = template.content.firstElementChild.cloneNode(true);

  node.querySelector(".pizza-name").textContent = `${pizza.name} · ${formatCurrency(
    pizza.basePrice
  )}`;
  node.querySelector(".pizza-description").textContent = pizza.description;

  const badge = node.querySelector(".badge");
  badge.hidden = !pizza.special;

  const sizeSelect = node.querySelector(".size-select");
  sizeOptions.forEach((size) => {
    const opt = document.createElement("option");
    opt.value = size.label;
    opt.textContent = size.label;
    sizeSelect.append(opt);
  });

  const crustSelect = node.querySelector(".crust-select");
  crustOptions.forEach((crust) => {
    const opt = document.createElement("option");
    opt.value = crust.label;
    opt.textContent =
      crust.addOn === 0
        ? crust.label
        : `${crust.label} (+${formatCurrency(crust.addOn)})`;
    crustSelect.append(opt);
  });

  const toppingsGrid = node.querySelector(".toppings-grid");
  toppingOptions.forEach((topping) => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${topping.label}" /> ${topping.label} (+${formatCurrency(
      topping.price
    )})`;
    toppingsGrid.append(label);
  });

  node.querySelector(".add-btn").addEventListener("click", () => {
    const size = sizeOptions.find((option) => option.label === sizeSelect.value);
    const crust = crustOptions.find((option) => option.label === crustSelect.value);
    const selectedToppings = Array.from(
      toppingsGrid.querySelectorAll('input[type="checkbox"]:checked')
    ).map((input) => {
      const topping = toppingOptions.find((option) => option.label === input.value);
      return { ...topping };
    });

    const toppingsPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
    const unitPrice = pizza.basePrice * size.multiplier + crust.addOn + toppingsPrice;

    // If identical pizzas are added, then merge
    const existing = state.cart.find(
      (item) =>
        item.pizzaId === pizza.id &&
        item.size === size.label &&
        item.crust === crust.label &&
        JSON.stringify(item.toppings.map((t) => t.label).sort()) ===
          JSON.stringify(selectedToppings.map((t) => t.label).sort())
    );

    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({
        id: crypto.randomUUID(),
        pizzaId: pizza.id,
        name: pizza.name,
        size: size.label,
        crust: crust.label,
        toppings: selectedToppings,
        unitPrice,
        quantity: 1,
      });
    }

    renderCart();
  });

  return node;
}

function renderMenu() {
  pizzas.forEach((pizza) => {
    // Specials are in own area 
    const target = pizza.special ? specialsList : pizzaList;
    target.append(makePizzaCard(pizza));
  });
}

function calculateTotals() {
  const subtotal = state.cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  let discountAmount = 0;
  if (state.appliedDiscount) {
    if (state.appliedDiscount.type === "percent") {
      discountAmount = subtotal * state.appliedDiscount.value;
    }
    if (state.appliedDiscount.type === "flat") {
      discountAmount = state.appliedDiscount.value;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  // Tax is calculated on post-discount amount (typical POS behavior).
  const taxableAmount = Math.max(subtotal - discountAmount, 0);
  const tax = taxableAmount * TAX_RATE;
  const total = taxableAmount + tax;

  return { subtotal, discountAmount, tax, total };
}

function renderCart() {
  cartItems.innerHTML = "";

  if (!state.cart.length) {
    cartItems.innerHTML = '<p class="empty">Your cart is empty.</p>';
  }

  state.cart.forEach((item) => {
    const wrapper = document.createElement("article");
    wrapper.className = "cart-item";

    const toppingsText = item.toppings.length
      ? item.toppings.map((t) => t.label).join(", ")
      : "No extra toppings";

    wrapper.innerHTML = `
      <div class="cart-item__top">
        <span>${item.name}</span>
        <span>${formatCurrency(item.unitPrice * item.quantity)}</span>
      </div>
      <small>${item.size} • ${item.crust}</small>
      <small>${toppingsText}</small>
      <div class="cart-item__controls">
        <input type="number" min="1" value="${item.quantity}" aria-label="Quantity for ${item.name}" />
        <button class="remove-btn">Remove</button>
      </div>
    `;

    const qtyInput = wrapper.querySelector('input[type="number"]');
    qtyInput.addEventListener("change", (event) => {
      const value = Number(event.target.value);
      // this is so quantity cannot be negitive
      item.quantity = Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
      renderCart();
    });

    wrapper.querySelector(".remove-btn").addEventListener("click", () => {
      state.cart = state.cart.filter((cartItem) => cartItem.id !== item.id);
      renderCart();
    });

    cartItems.append(wrapper);
  });

  const totals = calculateTotals();
  subtotalEl.textContent = formatCurrency(totals.subtotal);
  discountEl.textContent = `-${formatCurrency(totals.discountAmount)}`;
  taxEl.textContent = formatCurrency(totals.tax);
  totalEl.textContent = formatCurrency(totals.total);
}

document.getElementById("apply-discount").addEventListener("click", () => {
  const code = discountCodeInput.value.trim().toUpperCase();
  const discount = discountCodes[code];

  if (!code) {
    state.appliedDiscount = null;
    discountMessage.textContent = "";
  } else if (discount) {
    state.appliedDiscount = discount;
    discountMessage.textContent = `Applied ${code}: ${discount.label}`;
    discountMessage.classList.add("success");
  } else {
    state.appliedDiscount = null;
    discountMessage.textContent = "Invalid code. Try PIZZA10 or FAMILY5.";
    discountMessage.classList.remove("success");
  }

  renderCart();
});

renderMenu();
renderCart();
