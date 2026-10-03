const menuBtn = document.querySelector(".menu-btn");
const nav = document.getElementById("nav");

menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});

nav.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
});

const ANSWERS = {
  ship: ["When will my order ship?", "Most orders go out the same day. Orders placed after noon Pacific go out the next business day. We ship from Oceanside, California by USPS or FedEx, and you choose the service level at checkout."],
  flam: ["Shipping primers and sealers", "Primers, topcoat sealers and oil-base size are flammable, so they ship by ground service only, within the US and Canada. If your cart mixes these with other items, we will sort out the shipping."],
  ret: ["Returns and exchanges", "You have 60 days to return an item. Special and custom orders cannot be returned. A restocking fee of 6% applies within 30 days and 12% within 60 days."],
  bulk: ["Ordering in bulk", "For orders above 2,000 leaves, send us a message with what you need and we will reply by email with special pricing."],
  intl: ["Ordering from outside the US", "We ship to Canada, Australia, New Zealand, and the UK and EU (EU orders need a valid VAT number). Send us your order details in a message and we will reply by email with an invoice and your shipping and payment options."],
  missing: ["Can't find an item", "If we do not carry something you need, tell us what you are looking for in a message. We will reply by email."]
};

const answerBox = document.getElementById("answer");
const chipBtns = document.querySelectorAll(".chips button");
chipBtns.forEach((btn) => {
  btn.setAttribute("aria-pressed", "false");
  btn.addEventListener("click", () => {
    const [title, text] = ANSWERS[btn.dataset.a];
    chipBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    answerBox.innerHTML = "";
    const strong = document.createElement("strong");
    strong.textContent = title;
    const p = document.createElement("p");
    p.textContent = text;
    const more = document.createElement("a");
    more.href = "#msg";
    more.textContent = "Still need help? Send a message";
    answerBox.append(strong, p, more);
  });
});

const form = document.getElementById("msg");
const note = document.getElementById("form-note");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const d = new FormData(form);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.get("email")).trim());
  if (!String(d.get("name")).trim() || !emailOk || !String(d.get("message")).trim()) {
    note.textContent = "Please add your name, a valid email, and your question.";
    note.className = "form-note err";
    return;
  }
  note.textContent = "Thank you. This is a prototype, so nothing was sent.";
  note.className = "form-note ok";
  form.reset();
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion) {
  document.querySelectorAll("svg").forEach((svg) => svg.pauseAnimations && svg.pauseAnimations());
}

const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("in"));
}
