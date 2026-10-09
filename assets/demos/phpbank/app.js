/* PHP BANK — browser-only replica of the Laravel app's screens and rules.
   Validation limits and messages mirror the real controllers:
     AuthController     — 18+ age check, unique email/phone, min-6 passwords,
                          "The provided credentials are incorrect." / inactive account
     AccountController  — top-up €5–€9,999.99 with 16-digit card / 3-digit CVV /
                          expiry not past and ≤15 years ahead; transfer €1–€999,999.99
                          to an existing, different email with sufficient balance;
                          change email (password + unique + confirmed); change password
     TwoFAController    — enable/disable 2FA, send a test 6-digit code (expires in 10 min)
   Money is kept in integer cents (the real app uses bcadd() to avoid float errors).
   Everything lives in memory; all text is rendered with textContent. */
(function () {
  "use strict";

  /* ------------------------------------------------------------- data -- */
  const accounts = [
    { id: 1, first: "Alex", last: "Murphy", email: "demo@phpbank.ie", phone: null, password: "password1", active: true, balance: 1250000, twoFA: false, lastLogin: null },
    { id: 2, first: "Olena", last: "Kovalenko", email: "olena@phpbank.ie", phone: null, password: "olena-pass", active: true, balance: 320000, twoFA: true, lastLogin: null },
    { id: 3, first: "Sean", last: "O'Brien", email: "sean@phpbank.ie", phone: null, password: "sean-pass", active: true, balance: 89050, twoFA: false, lastLogin: null },
    { id: 4, first: "Closed", last: "Account", email: "closed@phpbank.ie", phone: null, password: "closed-pass", active: false, balance: 0, twoFA: false, lastLogin: null }
  ];
  const daysAgo = n => new Date(Date.now() - n * 864e5);
  const transactions = [
    { accountId: 1, type: "Deposit", description: "Account Top-Up", amount: 1000000, balanceAfter: 1000000, date: daysAgo(12) },
    { accountId: 1, type: "Transfer Received", description: "From olena@phpbank.ie", amount: 300000, balanceAfter: 1300000, date: daysAgo(6) },
    { accountId: 1, type: "Transfer Sent", description: "To sean@phpbank.ie", amount: -50000, balanceAfter: 1250000, date: daysAgo(2) }
  ];

  const state = { accountId: null, view: "login", flash: null, errors: {}, values: {}, testCode: null };
  const me = () => accounts.find(a => a.id === state.accountId);
  const byEmail = email => accounts.find(a => a.email.toLowerCase() === String(email).trim().toLowerCase());

  /* ----------------------------------------------------------- helpers -- */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      const v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.slice(0, 2) === "on") node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    });
    (children || []).forEach(c => { if (c != null) node.append(c.nodeType ? c : document.createTextNode(String(c))); });
    return node;
  }

  const ICONS = {
    home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    lock: "M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z",
    mail: "M3 6h18v12H3zM3 7l9 6 9-6",
    key: "M7 15a4 4 0 1 1 3.5-6H21v4h-3v3h-3v-3h-4.5A4 4 0 0 1 7 15z",
    logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11",
    wallet: "M3 7h15a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H3zM3 7l12-4v4M16 14h2",
    transfer: "M4 8h14l-4-4M20 16H6l4 4",
    doc: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0"
  };
  function icon(name) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", ICONS[name]);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.append(path);
    return svg;
  }

  const euro = cents => "€" + (cents / 100).toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = d => d.toLocaleString("en-IE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // "12.50" -> 1250; null if not a valid amount with at most 2 decimals.
  function toCents(v) {
    const s = String(v).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
    const [whole, frac = ""] = s.split(".");
    return parseInt(whole, 10) * 100 + parseInt((frac + "00").slice(0, 2), 10);
  }

  function go(view, flash) {
    state.view = view;
    state.flash = flash || null;
    state.errors = {};
    state.values = {};
    render();
    window.scrollTo(0, 0);
  }

  /* --------------------------------------------------------- form kit -- */
  function field(name, label, type, extra) {
    const id = "f-" + name;
    const err = state.errors[name];
    const input = el("input", Object.assign({
      id: id, name: name, type: type || "text", value: state.values[name] || "",
      "aria-invalid": err ? "true" : null, "aria-describedby": err ? id + "-err" : null
    }, extra || {}));
    return el("div", { class: "field" }, [
      el("label", { for: id, text: label }), input,
      err ? el("p", { class: "field-error", id: id + "-err", text: err }) : null
    ]);
  }

  function form(fields, submitLabel, onValid) {
    return el("form", {
      class: "form", novalidate: true,
      onsubmit: function (evt) {
        evt.preventDefault();
        const values = {};
        new FormData(evt.target).forEach((v, k) => { values[k] = String(v); });
        const errors = {};
        const result = onValid(values, errors);
        if (Object.keys(errors).length) {
          state.errors = errors;
          // Never re-fill password or card fields after a failed submit.
          Object.keys(values).forEach(k => { if (/password|card|cvv/.test(k)) delete values[k]; });
          state.values = values;
          state.flash = null;
          render();
          const firstBad = document.querySelector('[aria-invalid="true"]');
          if (firstBad) firstBad.focus();
        } else if (result) {
          result();
        }
      }
    }, fields.concat([el("button", { class: "btn btn-block", type: "submit", text: submitLabel })]));
  }

  function flashBox() {
    if (!state.flash) return null;
    return el("div", { class: "alert alert-" + state.flash.type, role: "status", text: state.flash.text });
  }

  /* ------------------------------------------------------ auth screens -- */
  function authShell(title, sub, body, links) {
    return el("main", { class: "auth" }, [
      el("div", { class: "auth-card" }, [
        logo(), el("h1", { text: title }), el("p", { class: "auth-sub", text: sub }),
        flashBox()
      ].concat(body).concat([el("div", { class: "auth-links" }, links)]))
    ]);
  }

  function logo() {
    return el("div", { class: "logo" }, [
      el("span", { class: "logo-mark", text: "PB" }),
      el("span", { class: "logo-text" }, ["PHP ", el("span", { text: "BANK" })])
    ]);
  }

  function loginView() {
    return authShell("Welcome back", "Log in to your PHP BANK account", [
      el("div", { class: "hint" }, ["Demo account — email ", el("strong", { text: "demo@phpbank.ie" }), ", password ", el("strong", { text: "password1" })]),
      form([field("email", "Email", "email", { autocomplete: "username" }), field("password", "Password", "password", { autocomplete: "current-password" })],
        "Log In", function (v, errors) {
          if (!v.email) errors.email = "The email field is required.";
          else if (!isEmail(v.email)) errors.email = "The email field must be a valid email address.";
          if (!v.password) errors.password = "The password field is required.";
          else if (v.password.length < 6) errors.password = "The password field must be at least 6 characters.";
          if (Object.keys(errors).length) return;
          const acc = byEmail(v.email);
          if (!acc || acc.password !== v.password) { errors.email = "The provided credentials are incorrect."; return; }
          if (!acc.active) { errors.email = "This account is not active."; return; }
          return function () {
            acc.lastLogin = new Date();
            state.accountId = acc.id;
            state.testCode = null;
            go("dashboard", { type: "ok", text: "Welcome back, " + acc.first + "!" });
          };
        })
    ], [
      el("button", { class: "link", type: "button", text: "Forgot password?", onclick: () => go("recover") }),
      el("button", { class: "link", type: "button", text: "Create account", onclick: () => go("register") })
    ]);
  }

  function registerView() {
    return authShell("Create account", "Open a PHP BANK account in a minute", [
      form([
        el("div", { class: "form-grid" }, [field("first_name", "First name", "text", { autocomplete: "given-name" }), field("last_name", "Last name", "text", { autocomplete: "family-name" })]),
        field("email", "Email", "email", { autocomplete: "email" }),
        el("div", { class: "form-grid" }, [field("phone", "Phone", "tel", { autocomplete: "off" }), field("dob", "Date of birth", "date")]),
        field("password", "Password", "password", { autocomplete: "new-password" }),
        field("password_confirmation", "Confirm password", "password", { autocomplete: "new-password" })
      ], "Create account", function (v, errors) {
        ["first_name", "last_name"].forEach(k => {
          if (!v[k].trim()) errors[k] = "This field is required.";
          else if (v[k].length > 30) errors[k] = "Must not be greater than 30 characters.";
        });
        if (!isEmail(v.email)) errors.email = "The email field must be a valid email address.";
        else if (v.email.length > 50) errors.email = "The email must not be greater than 50 characters.";
        else if (byEmail(v.email)) errors.email = "The email has already been taken.";
        if (!/^\+?[\d\s]{6,15}$/.test(v.phone.trim())) errors.phone = "Enter a phone number (max 15 characters).";
        else if (accounts.some(a => a.phone && a.phone === v.phone.trim())) errors.phone = "The phone has already been taken.";
        const dob = v.dob ? new Date(v.dob) : null;
        const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - 18);
        if (!dob || isNaN(dob)) errors.dob = "The date of birth field is required.";
        else if (dob >= cutoff) errors.dob = "You must be at least 18 years old to open an account.";
        if (v.password.length < 6) errors.password = "The password field must be at least 6 characters.";
        else if (v.password !== v.password_confirmation) errors.password_confirmation = "The password field confirmation does not match.";
        if (Object.keys(errors).length) return;
        return function () {
          accounts.push({ id: accounts.length + 1, first: v.first_name.trim(), last: v.last_name.trim(), email: v.email.trim(), phone: v.phone.trim(),
            password: v.password, active: true, balance: 0, twoFA: false, lastLogin: null });
          go("login", { type: "ok", text: "Account created — you can now log in." });
          state.values = { email: v.email.trim() };
          render();
        };
      })
    ], [el("button", { class: "link", type: "button", text: "Already have an account? Log in", onclick: () => go("login") })]);
  }

  function recoverView() {
    return authShell("Recover password", "We'll email you a link to reset it", [
      form([field("email", "Email", "email")], "Send recovery link", function (v, errors) {
        if (!isEmail(v.email)) { errors.email = "The email field must be a valid email address."; return; }
        return () => go("recover", { type: "info", text: "If an account exists for that email, a recovery link has been sent. (Demo: no email is actually sent.)" });
      })
    ], [el("button", { class: "link", type: "button", text: "Back to log in", onclick: () => go("login") })]);
  }

  /* ---------------------------------------------------- logged-in pages -- */
  const NAV = [
    ["dashboard", "Dashboard", "home"],
    ["2fa", "Manage 2FA", "lock"],
    ["email", "Change email", "mail"],
    ["password", "Change password", "key"]
  ];

  function shell(title, content) {
    const acc = me();
    return el("div", { class: "app-inner" }, [
      el("aside", { class: "sidebar" }, [
        logo(),
        el("nav", { class: "nav", "aria-label": "Account" }, NAV.map(([view, label, ic]) =>
          el("button", { type: "button", class: "nav-btn" + (state.view === view ? " is-active" : ""), "aria-current": state.view === view ? "page" : null, onclick: () => go(view) }, [icon(ic), label])
        )),
        el("div", { class: "sidebar-foot" }, [
          el("button", { type: "button", class: "nav-btn", onclick: function () { state.accountId = null; state.testCode = null; go("login", { type: "ok", text: "You have been signed off." }); } }, [icon("logout"), "Sign Off"])
        ])
      ]),
      el("main", { class: "main" }, [
        el("div", { class: "page-head" }, [el("span", { class: "avatar" }, [icon("user")]), el("h1", { text: title || (acc.first + " " + acc.last) })]),
        flashBox()
      ].concat(content))
    ]);
  }

  function dashboardView() {
    const acc = me();
    const last = transactions.filter(t => t.accountId === acc.id).slice(-1)[0];
    return shell(null, [
      el("section", { class: "card", "aria-label": "Balance" }, [
        el("p", { class: "balance-label", text: "Current Balance" }),
        el("p", { class: "balance", text: euro(acc.balance) }),
        el("div", { class: "last-tx" }, last
          ? ["Last Transaction: ", el("strong", { text: (last.amount < 0 ? "−" : "+") + euro(Math.abs(last.amount)) }), " · " + last.type]
          : ["Last Transaction: No transactions (yet)"])
      ]),
      el("div", { class: "actions" }, [
        el("button", { type: "button", class: "action", onclick: () => go("topup") }, [icon("wallet"), "Top up"]),
        el("button", { type: "button", class: "action", onclick: () => go("transfer") }, [icon("transfer"), "Transfer"]),
        el("button", { type: "button", class: "action", onclick: () => go("transactions") }, [icon("doc"), "Transactions"])
      ]),
      el("section", { class: "card" }, [
        el("h2", { text: "Account details" }),
        el("div", { class: "details" }, [
          el("dl", { class: "detail" }, [el("dt", { text: "Email" }), el("dd", { text: acc.email }), el("dt", { text: "Password" }), el("dd", { text: "********" })]),
          el("dl", { class: "detail" }, [
            el("dt", { text: "Last Login" }), el("dd", { text: acc.lastLogin ? fmtDate(acc.lastLogin) : "—" }),
            el("dt", { text: "2FA Status" }), el("dd", {}, [el("span", { class: "badge " + (acc.twoFA ? "badge-on" : "badge-off"), text: acc.twoFA ? "Enabled" : "Disabled" })])
          ])
        ])
      ])
    ]);
  }

  function addTx(acc, type, description, amount) {
    acc.balance += amount;
    transactions.push({ accountId: acc.id, type: type, description: description, amount: amount, balanceAfter: acc.balance, date: new Date() });
  }

  function topupView() {
    const acc = me();
    return shell("Top up", [
      el("section", { class: "card" }, [
        el("div", { class: "hint" }, ["Demo only — use a made-up card such as ", el("strong", { text: "4242 4242 4242 4242" }), ". Never enter a real card; nothing is charged, stored or sent."]),
        form([
          field("amount", "Amount (€5 – €9,999.99)", "text", { inputmode: "decimal", placeholder: "50.00" }),
          field("cardholder", "Cardholder name", "text", { autocomplete: "off" }),
          field("card_number", "Card number", "text", { inputmode: "numeric", autocomplete: "off", placeholder: "1234 5678 9012 3456" }),
          el("div", { class: "form-grid" }, [
            field("expiry", "Expiry (MM/YY)", "text", { inputmode: "numeric", autocomplete: "off", placeholder: "08/29" }),
            field("cvv", "CVV", "password", { inputmode: "numeric", autocomplete: "off", maxlength: "3" })
          ])
        ], "Top up", function (v, errors) {
          const cents = toCents(v.amount);
          if (cents == null) errors.amount = "Enter an amount like 50 or 50.00.";
          else if (cents < 500) errors.amount = "The minimum top-up is €5.00.";
          else if (cents > 999999) errors.amount = "The maximum top-up is €9,999.99.";
          if (!/^[A-Za-z\s]+$/.test(v.cardholder.trim())) errors.cardholder = "The cardholder name may only contain letters and spaces.";
          if (!/^\d{16}$/.test(v.card_number.replace(/\s/g, ""))) errors.card_number = "The card number must be 16 digits.";
          if (!/^\d{3}$/.test(v.cvv)) errors.cvv = "The CVV must be 3 digits.";
          const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(v.expiry.trim());
          if (!m) errors.expiry = "Use the format MM/YY.";
          else {
            const endOfMonth = new Date(2000 + +m[2], +m[1], 0, 23, 59, 59);
            const limit = new Date(); limit.setFullYear(limit.getFullYear() + 15);
            if (endOfMonth < new Date()) errors.expiry = "This card has expired.";
            else if (endOfMonth > limit) errors.expiry = "The expiry date can't be more than 15 years ahead.";
          }
          if (Object.keys(errors).length) return;
          return function () {
            addTx(acc, "Deposit", "Account Top-Up", cents);
            go("dashboard", { type: "ok", text: "Top-up successful — " + euro(cents) + " added to your balance." });
          };
        })
      ])
    ]);
  }

  function transferView() {
    const acc = me();
    const others = accounts.filter(a => a.id !== acc.id && a.active).map(a => a.email).join(", ");
    return shell("Transfer", [
      el("section", { class: "card" }, [
        el("p", { class: "muted" }, ["Available: ", el("strong", { text: euro(acc.balance) })]),
        el("div", { class: "hint", text: "Other demo accounts you can send to: " + others }),
        form([
          field("recipient_email", "Recipient email", "email"),
          field("amount", "Amount (€1 – €999,999.99)", "text", { inputmode: "decimal", placeholder: "20.00" }),
          field("description", "Reference (optional)", "text", { maxlength: "60" })
        ], "Send transfer", function (v, errors) {
          const to = byEmail(v.recipient_email);
          if (!isEmail(v.recipient_email)) errors.recipient_email = "The recipient email must be a valid email address.";
          else if (!to) errors.recipient_email = "No account found with that email.";
          else if (to.id === acc.id) errors.recipient_email = "You can't transfer money to yourself.";
          const cents = toCents(v.amount);
          if (cents == null) errors.amount = "Enter an amount like 20 or 20.00.";
          else if (cents < 100) errors.amount = "The minimum transfer is €1.00.";
          else if (cents > 99999999) errors.amount = "The maximum transfer is €999,999.99.";
          else if (cents > acc.balance) errors.amount = "Insufficient balance for this transfer.";
          if (Object.keys(errors).length) return;
          return function () {
            // Real app: one DB::transaction() updates both balances and writes both records.
            const ref = v.description.trim();
            addTx(acc, "Transfer Sent", "To " + to.email + (ref ? " — " + ref : ""), -cents);
            addTx(to, "Transfer Received", "From " + acc.email + (ref ? " — " + ref : ""), cents);
            go("dashboard", { type: "ok", text: "Transfer completed — " + euro(cents) + " sent to " + to.email + "." });
          };
        })
      ])
    ]);
  }

  function transactionsView() {
    const acc = me();
    const rows = transactions.filter(t => t.accountId === acc.id).slice().reverse();
    return shell("Transactions", [
      el("section", { class: "card" }, rows.length ? [
        el("div", { class: "table-wrap" }, [
          el("table", {}, [
            el("thead", {}, [el("tr", {}, ["Date", "Type", "Details", "Amount", "Balance after"].map(h => el("th", { scope: "col", text: h })))]),
            el("tbody", {}, rows.map(t => el("tr", {}, [
              el("td", { text: fmtDate(t.date) }), el("td", { text: t.type }), el("td", { text: t.description }),
              el("td", { class: t.amount < 0 ? "amt-out" : "amt-in", text: (t.amount < 0 ? "−" : "+") + euro(Math.abs(t.amount)) }),
              el("td", { text: euro(t.balanceAfter) })
            ])))
          ])
        ])
      ] : [el("p", { class: "muted", text: "No transactions (yet)." })])
    ]);
  }

  function twoFAView() {
    const acc = me();
    const code = state.testCode;
    const minutesLeft = code ? Math.max(0, Math.ceil((code.expires - Date.now()) / 60000)) : 0;
    return shell("Two-Factor Authentication", [
      el("section", { class: "card" }, [
        el("p", {}, ["Status: ", el("span", { class: "badge " + (acc.twoFA ? "badge-on" : "badge-off"), text: acc.twoFA ? "Enabled" : "Disabled" })]),
        el("p", { class: "muted", text: "When enabled, PHP BANK can email you a one-time 6-digit code. Codes expire after 10 minutes, and requesting a new one replaces any unused code." }),
        el("div", { class: "form" }, [
          el("button", { type: "button", class: "btn btn-block", text: acc.twoFA ? "Disable 2FA" : "Enable 2FA", onclick: function () {
            acc.twoFA = !acc.twoFA;
            if (!acc.twoFA) state.testCode = null;  // real service deletes existing codes on disable
            go("2fa", { type: "ok", text: acc.twoFA ? "Two-Factor Authentication enabled." : "Two-Factor Authentication disabled." });
          } }),
          el("button", { type: "button", class: "btn btn-ghost btn-block", text: "Send test code", onclick: function () {
            if (!acc.twoFA) { go("2fa", { type: "err", text: "Two-Factor Authentication is not enabled." }); return; }
            const n = crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000;
            state.testCode = { value: String(n), expires: Date.now() + 10 * 60000 };
            go("2fa", { type: "ok", text: "Test code sent to your email." });
          } })
        ]),
        code ? el("div", { class: "inbox", "aria-label": "Simulated email inbox" }, [
          el("div", { class: "inbox-head", text: "Simulated inbox · To: " + acc.email + " · Subject: Your PHP BANK verification code" }),
          el("p", { text: "Your verification code is:" }),
          el("p", { class: "inbox-code", text: code.value }),
          el("p", { text: "It expires in " + minutesLeft + " minute" + (minutesLeft === 1 ? "" : "s") + "." })
        ]) : null
      ])
    ]);
  }

  function emailView() {
    const acc = me();
    return shell("Change email", [
      el("section", { class: "card" }, [
        el("p", { class: "muted" }, ["Current email: ", el("strong", { text: acc.email })]),
        form([
          field("current_password", "Current password", "password", { autocomplete: "current-password" }),
          field("email", "New email", "email"),
          field("email_confirmation", "Confirm new email", "email")
        ], "Update email", function (v, errors) {
          if (v.current_password !== acc.password) errors.current_password = "The password is incorrect.";
          if (!isEmail(v.email)) errors.email = "The email field must be a valid email address.";
          else if (byEmail(v.email)) errors.email = "The email has already been taken.";
          else if (v.email.trim().toLowerCase() !== v.email_confirmation.trim().toLowerCase()) errors.email_confirmation = "The email confirmation does not match.";
          if (Object.keys(errors).length) return;
          return function () { acc.email = v.email.trim(); go("dashboard", { type: "ok", text: "Email updated successfully." }); };
        })
      ])
    ]);
  }

  function passwordView() {
    const acc = me();
    return shell("Change password", [
      el("section", { class: "card" }, [
        form([
          field("current_password", "Current password", "password", { autocomplete: "current-password" }),
          field("password", "New password", "password", { autocomplete: "new-password" }),
          field("password_confirmation", "Confirm new password", "password", { autocomplete: "new-password" })
        ], "Update password", function (v, errors) {
          if (v.current_password !== acc.password) errors.current_password = "The current password is incorrect.";
          if (v.password.length < 6) errors.password = "The new password must be at least 6 characters.";
          else if (v.password === acc.password) errors.password = "The new password must be different from your current password.";
          else if (v.password !== v.password_confirmation) errors.password_confirmation = "The password confirmation does not match.";
          if (Object.keys(errors).length) return;
          return function () { acc.password = v.password; go("dashboard", { type: "ok", text: "Password changed successfully." }); };
        })
      ])
    ]);
  }

  /* ------------------------------------------------------------ render -- */
  const VIEWS = { login: loginView, register: registerView, recover: recoverView, dashboard: dashboardView, topup: topupView,
    transfer: transferView, transactions: transactionsView, "2fa": twoFAView, email: emailView, password: passwordView };
  const PUBLIC = new Set(["login", "register", "recover"]);

  function render() {
    if (!PUBLIC.has(state.view) && !me()) { state.view = "login"; state.flash = { type: "err", text: "Please login first." }; }
    const root = document.getElementById("app");
    root.replaceChildren(VIEWS[state.view]());
    root.append(el("div", { class: "demo-banner", text: "Live demo · data stays in this tab and resets on reload" }));
  }

  // The portfolio's "Two-Factor" card opens the demo straight on the 2FA page.
  if (location.hash === "#2fa") {
    const demo = accounts[0];
    demo.lastLogin = new Date();
    state.accountId = demo.id;
    state.view = "2fa";
    state.flash = { type: "info", text: "Signed in as the demo user (demo@phpbank.ie). Enable 2FA, then send yourself a test code." };
  }
  render();
})();
