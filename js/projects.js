/* =========================================================================
   projects.js — THE SINGLE FILE TO EDIT WHEN ADDING/CHANGING A PROJECT.

   Everything on the site (except the CV section and page chrome) is drawn
   from the PROJECTS array below by js/app.js. To add a project, copy an
   existing object, change its fields, and add it to the array — you never
   need to touch index.html, styles.css or app.js.

   -------------------------------------------------------------------------
   FIELD REFERENCE
   -------------------------------------------------------------------------
   id            (string, required, unique) kebab-case slug, e.g. "y1s1-my-project".
   title         (string, required) real, specific project title.
   year          (number 1|2|3, or the string "diploma", required)
                 Controls which page section the card appears in.
   semester      (number 1|2, or null for the diploma project, required)
                 Controls which semester sub-section the card appears in.
   course        (string, required) module/course name, shown as a small label.
   type          ("code" | "non-code", required) — "code" projects are expected
                 to have a codeSnippet and usually a `demo`; "non-code" projects
                 (reports, labs, design docs) just show description + links/images.
   description   (string, required) 2-4 sentences. Plain text (no HTML needed).
   tech           (array of strings) shown as small pills, e.g. ["Python", "SQL"].
   codeSnippet   (string or null) a short real excerpt, shown in a <pre> block.
   codeSnippetLang (string or null) language label, purely cosmetic.
   images        (array of relative paths, optional) first one is shown on the
                 card; all of them get a "Screenshot ↗" link. Put image files
                 under assets/images/<your-project-slug>/.
   links.repo    (string or null) URL to the code repository.
   links.live    (string or null) URL to a live/deployed version.
   demo          (optional) an interactive live-example panel. Two supported shapes:

                 1) Embed a real, self-contained HTML/CSS/JS project as-is
                    (closed by default; the card shows a "Full screen" button
                    that opens it in a full-window viewer):
                    demo: {
                      type: "iframe",
                      src: "assets/demos/<folder>/Index.html",  // copy the real
                                                                  // project files into
                                                                  // assets/demos/<folder>/
                      note: "optional short caption",
                      sameOrigin: true      // optional — ONLY if the demo needs
                                            // localStorage/cookies and loads no
                                            // third-party scripts. Default: fully
                                            // isolated sandbox.
                    }

                 2) A small hand-built simulation (used for languages that can't
                    run in a browser, e.g. Python/Java/C#/PHP — the point is to
                    demonstrate the *core idea* in a few lines of vanilla JS,
                    not to port the whole program):
                    demo: {
                      type: "custom",
                      note: "optional short caption",
                      render(container) {
                        // Build your mini widget into `container` using plain
                        // DOM APIs, or the small helper kit at
                        // window.PortfolioDemoKit (el, row, button, output,
                        // numberInput, textInput, select, bar) — see the many
                        // examples below for the pattern.
                      }
                    }

                 Omit `demo` entirely for non-code projects or code projects
                 you haven't built a demo for yet — the card just won't show
                 a live-example panel.
   -------------------------------------------------------------------------
   HOW TO ADD A NEW PROJECT
   -------------------------------------------------------------------------
   1. Copy the object that looks most like what you're adding.
   2. Give it a new unique `id`, correct `year`/`semester`/`course`.
   3. Write the description/tech/codeSnippet from your real project.
   4. If you have screenshots, drop them in assets/images/<slug>/ and list
      them in `images`.
   5. If it's a real HTML/CSS/JS project, copy its files into
      assets/demos/<slug>/ and use a `type: "iframe"` demo. Otherwise write a
      short `type: "custom"` demo, or skip `demo` entirely.
   6. Save the file — index.html doesn't need any changes.
   ========================================================================= */

const PROJECTS = (function () {
  /* -----------------------------------------------------------------------
     Small DOM helper kit used by the `type: "custom"` demos below. Defined
     here (rather than in app.js) because this file loads first — app.js
     only needs to call `demo.render(container)`, it never builds DOM itself
     using these helpers. Also exposed on window.PortfolioDemoKit in case
     you want to use it from a demo you paste in from elsewhere.
     ----------------------------------------------------------------------- */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "class") node.className = attrs[key];
        else if (key === "text") node.textContent = attrs[key];
        // cssText (CSSOM) rather than a style="" attribute — the page's Content
        // Security Policy blocks inline style attributes but allows this.
        else if (key === "style") node.style.cssText = attrs[key];
        else if (key.indexOf("on") === 0 && typeof attrs[key] === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
        } else {
          node.setAttribute(key, attrs[key]);
        }
      });
    }
    (children || []).forEach(function (child) {
      if (child == null) return;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    });
    return node;
  }

  function row(children) { return el("div", { class: "demo-row" }, children); }
  function label(text, forId) { return el("label", forId ? { for: forId, text: text } : { text: text }); }
  function button(text, onClick, opts) {
    const cls = (opts && opts.secondary) ? "demo-btn demo-btn-secondary" : "demo-btn";
    return el("button", { type: "button", class: cls, text: text, onclick: onClick });
  }
  function output(initialText) { return el("div", { class: "demo-output", text: initialText || "" }); }
  function numberInput(id, value, opts) {
    const attrs = { type: "number", id: id, value: value };
    if (opts && opts.min !== undefined) attrs.min = opts.min;
    if (opts && opts.max !== undefined) attrs.max = opts.max;
    if (opts && opts.step !== undefined) attrs.step = opts.step;
    return el("input", attrs);
  }
  function textInput(id, placeholder) {
    return el("input", { type: "text", id: id, placeholder: placeholder || "" });
  }
  function select(id, optionsArr) {
    const node = el("select", { id: id });
    optionsArr.forEach(function (opt) {
      node.append(el("option", { value: opt.value, text: opt.text }));
    });
    return node;
  }
  function bar(percent, isOver) {
    const fill = el("div", { class: "demo-bar-fill" + (isOver ? " is-over" : "") });
    fill.style.width = Math.min(100, Math.max(0, percent)) + "%";
    return el("div", { class: "demo-bar-track" }, [fill]);
  }

  window.PortfolioDemoKit = {
    el: el, row: row, label: label, button: button, output: output,
    numberInput: numberInput, textInput: textInput, select: select, bar: bar
  };

  const PROJECTS = [];

  /* =======================================================================
     YEAR 1 — SEMESTER 1
     ======================================================================= */

  // Digital logic labs — circuit-simulator project files + written reports,
  // no programmed source, so classified non-code (description + tech only).
  PROJECTS.push({
    id: "y1s1-computer-architecture-logic-labs",
    title: "Digital Logic Circuit Labs (Gates, Adders, Combinational Circuits)",
    year: 1, semester: 1, course: "Computer Architecture", type: "non-code",
    description: "Three digital-logic labs building and simulating combinational circuits on a logic-box simulator: a gates lab covering AND, NAND, OR, NOR, NOT, XOR and XNOR with truth tables, including designing an XNOR circuit from XOR+NOT when the dedicated chip wasn't available; an adders lab building and testing Half Adder and Full Adder circuits, recording truth tables and deriving the Boolean sum equation (S = AB + Ci(A⊕B)); and a second logic-circuits lab combining NOR/AND and NAND/OR gate networks and verifying simulated results against hand-derived truth tables.",
    tech: ["Digital Logic Design", "Logic Circuit Simulator", "Boolean Algebra"],
    codeSnippet: null, codeSnippetLang: null,
    images: [],
    links: { repo: null, live: null }
  });

  // Combines the 7 Network Fundamentals lab write-ups + the hardware lab.
  PROJECTS.push({
    id: "y1s1-network-fundamentals-labs",
    title: "Network Fundamentals Labs (Packet Tracer, Wireshark, Cisco CLI)",
    year: 1, semester: 1, course: "Network Fundamentals", type: "non-code",
    description: "Seven hands-on networking labs covering the practical side of the OSI/TCP-IP stack: command-line host diagnostics, FTP file transfer, HTTP packet capture and analysis in Wireshark, building topologies and configuring PCs/servers in Cisco Packet Tracer, inter-LAN routing between two routers over serial WAN links, subnetting and CIDR calculations, and basic switch configuration (VLAN 99 management IP, port security, MAC address table). A final hardware lab configured a physical Cisco switch over a console connection, documented step-by-step with photos of each CLI command.",
    tech: ["Cisco Packet Tracer", "Wireshark", "Cisco IOS CLI", "FTP", "Subnetting / CIDR"],
    codeSnippet: null, codeSnippetLang: null,
    images: [],
    links: { repo: null, live: null }
  });

  // Fun canvas re-creation of the Unity thrust/rotate + explosion-force input scheme.
  PROJECTS.push({
    id: "y1s1-rad-unity-space-shooter",
    title: "Space War — Unity 3D Space Combat Prototype",
    year: 1, semester: 1, course: "Rapid Application Development", type: "code",
    description: "A 3D Unity space-combat prototype with a player-controlled spaceship: W/S apply forward/backward thrust via Rigidbody.AddForce, while A/D and the arrow keys rotate the ship on multiple axes. A Bomb script uses Physics.OverlapSphere on a timer to find nearby rigidbodies and apply AddExplosionForce, pushing them away before destroying itself. Built with a lowpoly spaceship model and a starfield skybox across several incrementally-built scenes.",
    tech: ["Unity", "C#", "Rigidbody Physics"],
    codeSnippet: "void Update()\n{\n    transform.position += transform.forward * speed * Time.deltaTime;\n    acceleration = Vector3.zero;\n\n    if (Input.GetKey(KeyCode.W))\n    { rb.AddForce( transform.forward ); }\n\n    if (Input.GetKey(KeyCode.S))\n    { rb.AddForce(-transform.forward); }\n\n    if (Input.GetKey(KeyCode.D))\n    { transform.Rotate(Vector3.up, rateOfRotation * Time.deltaTime); }\n    else if (Input.GetKey(KeyCode.A))\n    { transform.Rotate(Vector3.down, rateOfRotation * Time.deltaTime); }\n}",
    codeSnippetLang: "csharp",
    images: [],
    links: { repo: "https://github.com/viterUA/Unity-Project-RAD-Y1", live: null },
    demo: {
      type: "custom",
      note: "A simplified 2D re-creation of the same thrust + rotate + explosion-force input scheme, in a canvas instead of Unity.",
      render(container) {
        const canvas = el("canvas", { width: "280", height: "170", style: "background:#0b0620;border-radius:8px;width:100%;max-width:280px;display:block;" });
        const ctx = canvas.getContext("2d");
        const ship = { x: 140, y: 85, angle: -Math.PI / 2 };
        const debris = [
          { x: 60, y: 40 }, { x: 220, y: 50 }, { x: 90, y: 130 },
          { x: 200, y: 120 }, { x: 140, y: 30 }, { x: 40, y: 100 }
        ];

        function draw() {
          ctx.clearRect(0, 0, 280, 170);
          ctx.fillStyle = "#F8D166";
          debris.forEach(function (d) { ctx.beginPath(); ctx.arc(d.x, d.y, 3, 0, Math.PI * 2); ctx.fill(); });

          ctx.save();
          ctx.translate(ship.x, ship.y);
          ctx.rotate(ship.angle + Math.PI / 2);
          ctx.fillStyle = "#9D00FF";
          ctx.beginPath();
          ctx.moveTo(0, -9); ctx.lineTo(7, 9); ctx.lineTo(-7, 9);
          ctx.closePath(); ctx.fill();
          ctx.restore();
        }

        function wrap(v, max) { return (v + max) % max; }

        draw();
        container.append(canvas, row([
          button("◀ Rotate", function () { ship.angle -= 0.35; draw(); }),
          button("Thrust ▲", function () {
            ship.x = wrap(ship.x + Math.cos(ship.angle) * 14, 280);
            ship.y = wrap(ship.y + Math.sin(ship.angle) * 14, 170);
            draw();
          }),
          button("Rotate ▶", function () { ship.angle += 0.35; draw(); }),
          button("💣 Drop Bomb", function () {
            let frame = 0;
            const timer = setInterval(function () {
              frame++;
              debris.forEach(function (d) {
                const dx = d.x - ship.x, dy = d.y - ship.y;
                const dist = Math.max(18, Math.sqrt(dx * dx + dy * dy));
                if (dist < 90) {
                  d.x += (dx / dist) * (10 / dist) * 40;
                  d.y += (dy / dist) * (10 / dist) * 40;
                }
              });
              draw();
              if (frame > 8) clearInterval(timer);
            }, 40);
          }, { secondary: true })
        ]));
      }
    }
  });

  PROJECTS.push({
    id: "y1s1-rad-cloud-linux-report",
    title: "RAD Coursework: Cloud Platform Review & Linux/Java Reflections",
    year: 1, semester: 1, course: "Rapid Application Development", type: "non-code",
    description: "A written review of Amazon Web Services covering the origin of Amazon S3, AWS's key products/services, and its competitive selling points versus other cloud platforms. A companion reflective report documents learning the Linux terminal (mkdir, cd, ls, rm, basic git commands for a first personal repository) and comparing Java's typed console output behaviour against JavaScript's client-side, dynamically-typed, event-driven execution model.",
    tech: ["AWS (research)", "Linux Terminal", "Git", "Java"],
    codeSnippet: null, codeSnippetLang: null,
    images: [],
    links: { repo: null, live: null }
  });

  PROJECTS.push({
    id: "y1s1-structured-programming-1-python-basics",
    title: "Structured Programming 1: Python Console Applications",
    year: 1, semester: 1, course: "Structured Programming 1", type: "code",
    description: "Three small console Python programs: a price-per-ounce calculator converting weight and computing cost per ounce; a mock 'MTU Kerry Banking' application gated by a username/password check offering a menu to reset the password, withdraw money, or convert euro to dollars; and a final-exam program modelling race entries that validates a 4-character entry-number format and classifies finish times into Advanced / Intermediate / Beginner categories.",
    tech: ["Python"],
    codeSnippet: "print(\"*\"*10,\"Welcome to the MTU Kerry Banking application\",\"*\"*10)\n\nanswer = input(\"Enter your username: \")\npassword = input(\"Enter the password: \")\n\nif answer.upper() and password.upper():\n    print(\"Please enter an option:\\n\\n\\t\\t\",\n            \"1.Reset your password\\n\\t\\t\",\n            \"2.Withdraw money\\n\\t\\t\",\n            \"3. Convert euro to dollars\")\n    answer2 = input(\"\")",
    codeSnippetLang: "python",
    images: [],
    links: { repo: "https://github.com/viterUA/Structured-Programming-1-CA-Y1", live: null },
    demo: {
      type: "custom",
      note: "Re-creation of the banking app's menu flow — the withdrawal and currency conversion maths run live in JS, printed to the panel below like the Python console output.",
      render(container) {
        let balance = 500;
        const out = output("Enter a username & password, then log in.");
        const user = textInput("bankUser", "username");
        const pass = textInput("bankPass", "password");
        const actions = el("div", { style: "display:none;" });

        function log(text) { out.textContent = text; }

        const withdrawAmt = numberInput("withdrawAmt", 50, { min: 0 });
        const eurAmt = numberInput("eurAmt", 10, { min: 0 });

        actions.append(
          row([label("Balance: €" + balance.toFixed(2))]),
          row([withdrawAmt, button("Withdraw", function () {
            const amt = Number(withdrawAmt.value) || 0;
            if (amt > balance) { log("Insufficient funds — balance is €" + balance.toFixed(2)); return; }
            balance -= amt;
            log("Withdrew €" + amt.toFixed(2) + " — new balance: €" + balance.toFixed(2));
          })]),
          row([eurAmt, button("Convert EUR → USD", function () {
            const amt = Number(eurAmt.value) || 0;
            log("€" + amt.toFixed(2) + " ≈ $" + (amt * 1.09).toFixed(2) + " (rate 1.09)");
          })]),
          row([button("Reset Password", function () { log("Password reset link sent (simulated)."); }, { secondary: true })])
        );

        container.append(
          row([label("Username", "bankUser"), user]),
          row([label("Password", "bankPass"), pass]),
          row([button("Log In", function () {
            if (!user.value || !pass.value) { log("Please enter both a username and password."); return; }
            actions.style.display = "flex";
            actions.style.flexDirection = "column";
            actions.style.gap = "10px";
            log("Logged in as " + user.value + ".");
          })]),
          actions,
          out
        );
      }
    }
  });

  PROJECTS.push({
    id: "y1s1-user-interfaces-cinema-app-ux",
    title: "FEO Cinema Booking App — UX/UI Design Project",
    year: 1, semester: 1, course: "User Interfaces", type: "non-code",
    description: "A UX design project for a movie-ticket booking app: defined three user personas with usage scenarios, ran user-testing sessions scoring the design across layout, text, colours, navigation, interactivity and ease-of-use, and produced a sitemap and user flows. Full-screen mockups (Introduction, Home screen, Search, Calendar) plus a library of reusable UI elements were designed in Photoshop and exported as layered PSDs with JPG/PNG previews.",
    tech: ["Adobe Photoshop", "Marvel (Prototyping)", "UX/UI Design", "User Personas", "Wireframing & Sitemaps"],
    codeSnippet: null, codeSnippetLang: null,
    images: [
      "assets/images/ui-feo/home-screen.jpg",
      "assets/images/ui-feo/introduction.jpg",
      "assets/images/ui-feo/calendar.jpg"
    ],
    links: { repo: "https://github.com/viterUA/User-Interfaces-Final-Project-Y1", live: null }
  });

  // Real static site — embedded as-is via iframe rather than simulated.
  PROJECTS.push({
    id: "y1s1-web-dev-1-mister-olympia",
    title: "Mister Olympia — Bodybuilding History Website",
    year: 1, semester: 1, course: "Web Development 1", type: "code",
    description: "A multi-page static website about the Mr. Olympia bodybuilding competition: a home page covering the contest's history, a winners page, a year-by-year winners table, a feedback form, and a sitemap. Shares a dark green-and-gold themed stylesheet built with CSS custom properties and Google Fonts, plus a responsive hamburger navigation menu toggled with vanilla JavaScript. The logo was designed by hand in Photoshop.",
    tech: ["HTML", "CSS", "JavaScript"],
    codeSnippet: "document.querySelectorAll('.nav-toggle').forEach(function(btn){\n    btn.addEventListener('click', function(){\n        var open = btn.classList.toggle('open');\n        document.querySelector('.navigation').classList.toggle('open');\n        btn.setAttribute('aria-expanded', open);\n    });\n});",
    codeSnippetLang: "html",
    images: [],
    links: { repo: "https://github.com/viterUA/Web-Development-CA1-Y1", live: null },
    demo: {
      type: "iframe",
      src: "assets/demos/mister-olympia/Index.html",
      note: "The actual submitted site — open it full screen and use its own nav menu to browse History, Years and Feedback."
    }
  });

  /* =======================================================================
     YEAR 1 — SEMESTER 2
     ======================================================================= */

  PROJECTS.push({
    id: "y1s2-database-concept-sql",
    title: "Database Concept: SQL Schema Design & Query Assessments",
    year: 1, semester: 2, course: "Database Concept", type: "code",
    description: "Two SQL continuous-assessment exercises. CA1 designed and populated a GP-surgery database (Doctors, Patients, Appointments) and answered 15 query questions covering sorting, filtering, aggregates, subqueries, joins and Oracle date functions. CA3 designed a driving-penalty-points database with a CHECK constraint restricting points to 1-12, then used ALTER TABLE to add columns and a foreign key, plus a LEFT JOIN to find licences with no endorsements.",
    tech: ["SQL", "Oracle PL/SQL", "Relational Database Design"],
    codeSnippet: "CREATE TABLE Licences(\nLicenceNo char(8),\nForename varchar2(15) NOT NULL,\nSurname varchar2(20) NOT NULL,\nDOB DATE NOT NULL,\nCONSTRAINT PK_Licences PRIMARY KEY (LicenceNo));\n\nCREATE TABLE Offences(\nOffenceID numeric(3),\nDescription varchar2(40) NOT NULL,\nPenaltyPoints numeric(2) CHECK (PenaltyPoints > 0 AND PenaltyPoints <= 12),\nCONSTRAINT PK_Offences PRIMARY KEY (OffenceID));",
    codeSnippetLang: "sql",
    images: [],
    links: { repo: null, live: null },
    demo: {
      type: "custom",
      note: "A few canned queries running against a small in-memory copy of the penalty-points data, standing in for the real SQL joins/aggregates.",
      render(container) {
        const licences = [
          { licence: "AB123456", name: "J. Murphy", points: 0 },
          { licence: "CD234567", name: "S. Byrne", points: 6 },
          { licence: "EF345678", name: "R. Walsh", points: 12 },
          { licence: "GH456789", name: "N. Kelly", points: 3 },
          { licence: "IJ567890", name: "A. Doyle", points: 0 }
        ];
        const queries = {
          none: { text: "Drivers with 0 penalty points", run: () => licences.filter(l => l.points === 0) },
          over: { text: "Drivers with more than 5 points", run: () => licences.filter(l => l.points > 5) },
          all: { text: "All licences, most points first", run: () => [...licences].sort((a, b) => b.points - a.points) }
        };
        const picker = select("queryPicker", [
          { value: "none", text: "Drivers with 0 points" },
          { value: "over", text: "Drivers with > 5 points" },
          { value: "all", text: "All, sorted by points" }
        ]);
        const resultsWrap = el("div");

        function renderTable() {
          const rows = queries[picker.value].run();
          const table = el("table", { class: "demo-table" }, [
            el("tr", {}, [el("th", { text: "Licence" }), el("th", { text: "Name" }), el("th", { text: "Points" })]),
            ...rows.map(r => el("tr", {}, [el("td", { text: r.licence }), el("td", { text: r.name }), el("td", { text: String(r.points) })]))
          ]);
          resultsWrap.innerHTML = "";
          resultsWrap.append(rows.length ? table : el("p", { class: "demo-note", text: "No matching rows." }));
        }

        picker.addEventListener("change", renderTable);
        renderTable();
        container.append(row([label("Query", "queryPicker"), picker]), resultsWrap);
      }
    }
  });

  PROJECTS.push({
    id: "y1s2-database-concept-data-modelling",
    title: "Database Concept CA2: Lottery System Data Model",
    year: 1, semester: 2, course: "Database Concept", type: "non-code",
    description: "An entity-relationship data-modelling assignment for a national-lottery-style ticketing system, defining entities for Agent, Ticket, Account, Online Purchase, Draw and Prize Details with their attributes, primary keys and data types, and mapping cardinality relationships between them using 1..1 / 0..* / 1..* notation.",
    tech: ["ER Diagrams", "Data Modelling", "Database Design"],
    codeSnippet: null, codeSnippetLang: null,
    images: [],
    links: { repo: null, live: null }
  });

  PROJECTS.push({
    id: "y1s2-operation-systems-1-labs",
    title: "Operating Systems 1 Labs (Windows Internals & Linux Install)",
    year: 1, semester: 2, course: "Operation Systems 1", type: "non-code",
    description: "Seven hands-on OS labs covering Windows 11 internals and a Linux install: exploring BIOS/UEFI setup during POST, viewing hardware info through Disk Management and Device Drivers, installing Fedora Workstation in VirtualBox, using Task Manager to inspect processes/CPU/memory and disk performance, using System Information and the Group Policy Editor, and tuning virtual memory, Disk Cleanup and the Registry Editor.",
    tech: ["Windows 11", "BIOS/UEFI", "Oracle VirtualBox", "Fedora Linux", "Group Policy Editor", "Registry Editor"],
    codeSnippet: null, codeSnippetLang: null,
    images: [],
    links: { repo: null, live: null }
  });

  PROJECTS.push({
    id: "y1s2-structured-programming-2-tkinter-cas",
    title: "Structured Programming 2: Tkinter GUI Assessments",
    year: 1, semester: 2, course: "Structured Programming 2", type: "code",
    description: "Two timed, closed-book Python assessments built with Tkinter GUI dialogs. 'Aces High' deals randomly ranked/suited playing cards across 3 rounds via simpledialog input boxes. The second builds an interactive password-validation loop that repeatedly prompts until the user enters a valid password: 8-15 characters, must start and end with a symbol from an allowed set, first and last characters must differ, and it must contain a minimum mix of uppercase, lowercase, digit and symbol characters.",
    tech: ["Python", "Tkinter"],
    codeSnippet: "password = simpledialog.askstring(\"Input\", \"Please enter a password value(return to exit)\")\n\nwhile(password != \"\"):\n    valid = False\n    lenght = len(password)\n    while(not valid):\n        if (lenght >= 8 and lenght <= 15):\n            if (password.startswith(\"£\") or password.startswith(\"%\") or password.startswith(\"&\") or\n                password.startswith(\"*\") or password.startswith(\"#\") or password.startswith(\".\")):",
    codeSnippetLang: "python",
    images: [],
    links: { repo: "https://github.com/viterUA/Structure-Programming-2-CA1-Y1", live: null },
    demo: {
      type: "custom",
      note: "The same rule set as the Tkinter validation loop, checked live as you type.",
      render(container) {
        const SYMS = "£%&*.#";
        const input = textInput("pwCheck", "Type a password…");
        const list = el("ul", { style: "list-style:none;padding:0;margin:0;font-size:0.85rem;display:flex;flex-direction:column;gap:4px;" });
        const rules = [
          { text: "8–15 characters", test: p => p.length >= 8 && p.length <= 15 },
          { text: "Starts with a symbol (£ % & * . #)", test: p => SYMS.includes(p[0]) },
          { text: "Ends with a symbol (£ % & * . #)", test: p => SYMS.includes(p[p.length - 1]) },
          { text: "First and last characters differ", test: p => p.length > 0 && p[0] !== p[p.length - 1] },
          { text: "Has upper, lower, digit and symbol", test: p => /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p) && [...p].some(c => SYMS.includes(c)) }
        ];

        function refresh() {
          const p = input.value;
          list.innerHTML = "";
          rules.forEach(function (r) {
            const ok = r.test(p);
            list.append(el("li", { style: "color:" + (ok ? "#1a7a3c" : "#b3261e") + ";", text: (ok ? "✓ " : "✗ ") + r.text }));
          });
        }
        input.addEventListener("input", refresh);
        refresh();
        container.append(row([label("Password", "pwCheck"), input]), list);
      }
    }
  });

  // Real static site — embedded as-is via iframe rather than simulated.
  PROJECTS.push({
    id: "y1s2-web-dev-2-bnb",
    title: "viter B&B — Guesthouse Booking Website",
    year: 1, semester: 2, course: "Web Development 2", type: "code",
    description: "A multi-page static website for a fictional Tralee guesthouse, with a home page presenting room types and guest reviews, a geolocation-powered 'How far are you?' distance calculator using the Haversine formula against the browser's current position, a room booking form, a feedback page, and a full SEO/favicon meta-tag setup, styled with a custom green-themed stylesheet.",
    tech: ["HTML", "CSS", "JavaScript", "Geolocation API"],
    codeSnippet: "function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {\n  var R = 6371;\n  var dLat = deg2rad(lat2-lat1);\n  var dLon = deg2rad(lon2-lon1);\n  var a =\n    Math.sin(dLat/2) * Math.sin(dLat/2) +\n    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *\n    Math.sin(dLon/2) * Math.sin(dLon/2);\n  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));\n  return R * c;\n}",
    codeSnippetLang: "javascript",
    images: [],
    links: { repo: "https://github.com/viterUA/Web-Development-CA2-Y1", live: null },
    demo: {
      type: "iframe",
      src: "assets/demos/bnb/Index.html",
      note: "The actual submitted site — open it full screen to browse the rooms, reviews and booking form. Demos run in an isolated sandbox, so the location-based \"How far are you?\" calculator is blocked here."
    }
  });

  /* =======================================================================
     YEAR 2 — SEMESTER 1
     ======================================================================= */

  PROJECTS.push({
    id: "y2s1-oop-java-ca1-blackjack",
    title: "Blackjack Card Game (OOP CA1)",
    year: 2, semester: 1, course: "OOP Java", type: "code",
    description: "Timed in-class Continuous Assessment for Object Oriented Programming: a variation of Blackjack (human vs computer) in Java/Swing, working from a 52-card array, a shuffling algorithm, and Unicode rank-and-suit rendering on a JOptionPane dialog. The deck-shuffling and display logic are implemented; the win-checking and turn-loop logic were left as commented pseudocode in the submitted file.",
    tech: ["Java", "Swing", "IntelliJ IDEA"],
    codeSnippet: "for(int i = 0; i < deck.length; i++){\n    boolean[] alreadyPicked = new boolean[52];\n    shuffledDeck[i] = (int) (Math.random() * 52 ) +1;\n\n    while(alreadyPicked[shuffledDeck[i]]){\n        if((i+1) % 13 == 0) {\n            shuffledDeck[i] = (int) (Math.random() * 52) + 1;\n            alreadyPicked[shuffledDeck[i]] = true;\n        }\n    }\n}\nSystem.out.println(\"Shuffled numeric deck values:\\n\" + Arrays.toString(shuffledDeck));",
    codeSnippetLang: "java",
    images: [],
    links: { repo: "https://github.com/viterUA/Object-Oriented-Programming-C1-Y2", live: null },
    demo: {
      type: "custom",
      note: "A playable Blackjack-lite: simplified hand values (face cards = 10, ace = 11), dealer stands on 17.",
      render(container) {
        const SUITS = ["♠", "♥", "♦", "♣"];
        const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
        let player = [], dealer = [], over = false;

        function draw() { const r = RANKS[Math.floor(Math.random() * RANKS.length)]; return { r: r, s: SUITS[Math.floor(Math.random() * 4)] }; }
        function value(hand) { return hand.reduce((sum, c) => sum + (c.r === "A" ? 11 : ["J", "Q", "K"].includes(c.r) ? 10 : Number(c.r)), 0); }
        function fmt(hand) { return hand.map(c => c.r + c.s).join(" "); }

        const out = output("Press Deal to start.");
        function refresh(revealDealer) {
          out.textContent =
            "You: " + fmt(player) + "  (" + value(player) + ")\n" +
            "Dealer: " + (revealDealer ? fmt(dealer) + "  (" + value(dealer) + ")" : dealer[0].r + dealer[0].s + " ??");
        }

        container.append(
          row([
            button("Deal", function () {
              player = [draw(), draw()]; dealer = [draw(), draw()]; over = false;
              refresh(false);
            }),
            button("Hit", function () {
              if (over) return;
              player.push(draw());
              if (value(player) > 21) { over = true; refresh(true); out.textContent += "\nBust — dealer wins!"; return; }
              refresh(false);
            }, { secondary: true }),
            button("Stand", function () {
              if (over || player.length === 0) return;
              while (value(dealer) < 17) dealer.push(draw());
              over = true;
              const p = value(player), d = value(dealer);
              let result = d > 21 || p > d ? "You win!" : p === d ? "Push." : "Dealer wins.";
              refresh(true);
              out.textContent += "\n" + result;
            }, { secondary: true })
          ]),
          out
        );
      }
    }
  });

  PROJECTS.push({
    id: "y2s1-oop-java-ca2-vetshop",
    title: "VetShop Appointment Booking System (OOP CA2)",
    year: 2, semester: 1, course: "OOP Java", type: "code",
    description: "Second timed OOP Continuous Assessment: a small veterinary-clinic domain model (Owner, Pet, Appointment, VetShop) built from a supplied UML diagram. Demonstrates encapsulation — constructors calling mutators, toString() calling accessors, a static counter auto-generating Pet IDs from 100001 upward, and defensive copying of the Owner object inside Pet.setOwner() so callers cannot mutate it from outside.",
    tech: ["Java", "IntelliJ IDEA", "Git"],
    codeSnippet: "public class Pet {\n    private static int count = 10000;\n    private int id;\n    private String name;\n    private Owner owner;\n\n    public Pet(String name, String type, String registrationDate, String dateOfBirth, Owner owner) {\n        setName(name);\n        setOwner(owner);\n        idCount();\n        setId(count);\n    }\n\n    private static void idCount() { count++; }\n}",
    codeSnippetLang: "java",
    images: [],
    links: { repo: "https://github.com/viterUA/Object-Oriented-Programming-C2-Y2", live: null },
    demo: {
      type: "custom",
      note: "Register a pet (auto-incrementing ID like the real Pet class) and check vet availability for a chosen slot.",
      render(container) {
        let nextId = 100001;
        const pets = [];
        const ownerName = textInput("ownerName", "Owner name");
        const petName = textInput("petName", "Pet name");
        const petsTable = el("div");

        function renderPets() {
          petsTable.innerHTML = "";
          if (!pets.length) { petsTable.append(el("p", { class: "demo-note", text: "No pets registered yet." })); return; }
          petsTable.append(el("table", { class: "demo-table" }, [
            el("tr", {}, [el("th", { text: "ID" }), el("th", { text: "Pet" }), el("th", { text: "Owner" })]),
            ...pets.map(p => el("tr", {}, [el("td", { text: String(p.id) }), el("td", { text: p.name }), el("td", { text: p.owner })]))
          ]));
        }

        const vets = ["Dr. Byrne", "Dr. Walsh", "Dr. Kelly"];
        const booked = new Set(["Dr. Walsh|10:00"]);
        const slotPicker = select("slotPicker", [{ value: "9:00", text: "9:00" }, { value: "10:00", text: "10:00" }, { value: "11:00", text: "11:00" }]);
        const availOut = output("");

        container.append(
          row([label("Owner", "ownerName"), ownerName, label("Pet", "petName"), petName,
            button("Register Pet", function () {
              if (!ownerName.value || !petName.value) return;
              pets.push({ id: nextId++, name: petName.value, owner: ownerName.value });
              renderPets();
            })]),
          petsTable,
          row([label("Slot", "slotPicker"), slotPicker,
            button("Check Availability", function () {
              const free = vets.filter(v => !booked.has(v + "|" + slotPicker.value));
              availOut.textContent = free.length ? "Available: " + free.join(", ") : "No vets free at that time.";
            }, { secondary: true })]),
          availOut
        );
        renderPets();
      }
    }
  });

  PROJECTS.push({
    id: "y2s1-oop-java-winter-exam-company-system",
    title: "Company Department & Payroll System (OOP Winter Exam)",
    year: 2, semester: 1, course: "OOP Java", type: "code",
    description: "Final winter-exam project: an abstract Employee class extended by Manager and Worker, aggregated into Department objects, demonstrating inheritance and polymorphism. calculateSalary() branches on the overridden getPosition() to apply compound salary-scale growth (managers +5%/yr from €90,000, workers +3%/yr from €40,000) based on years of service, capped at scale point 20.",
    tech: ["Java", "Swing", "IntelliJ IDEA"],
    codeSnippet: "public double calculateSalary() {\n    double salary = 0;\n    if(getPosition().contains(\"manager\")){\n         salary = 90000*Math.pow((1+0.05), getPointOnSalaryScale() -1 );\n    }\n    if (getPosition().contains(\"worker\")) {\n        salary = 40000 * Math.pow((1 + 0.03), getPointOnSalaryScale() - 1);\n    }\n    return salary;\n}",
    codeSnippetLang: "java",
    images: [],
    links: { repo: "https://github.com/viterUA/Object-Oriented-Programming-FE-Y2", live: null },
    demo: {
      type: "custom",
      note: "Same compounding formulas as calculateSalary(), recomputed live.",
      render(container) {
        const roleSel = select("roleSel", [{ value: "manager", text: "Manager (+5%/yr from €90,000)" }, { value: "worker", text: "Worker (+3%/yr from €40,000)" }]);
        const years = el("input", { type: "range", id: "yearsRange", min: "1", max: "20", value: "1" });
        const out = output("");

        function refresh() {
          const y = Number(years.value);
          const base = roleSel.value === "manager" ? 90000 : 40000;
          const rate = roleSel.value === "manager" ? 0.05 : 0.03;
          const salary = base * Math.pow(1 + rate, y - 1);
          out.textContent = "Years of service: " + y + "\nSalary: €" + salary.toLocaleString("en-IE", { maximumFractionDigits: 0 });
        }
        roleSel.addEventListener("change", refresh);
        years.addEventListener("input", refresh);
        refresh();
        container.append(row([label("Role", "roleSel"), roleSel]), row([label("Years employed", "yearsRange"), years]), out);
      }
    }
  });

  PROJECTS.push({
    id: "y2s1-software-testing-clock-junit",
    title: "Clock Class — JUnit Test Suite & JaCoCo Coverage",
    year: 2, semester: 1, course: "Software Testing", type: "code",
    description: "A Continuous Assessment applying formal testing methodology to a small Clock class (hours/minutes/seconds, with validation and rollover). JUnit 5 tests cover default and parameterised construction, boundary and invalid-input handling for each field (out-of-range values reset to 0), the formatted time output, and rollover behaviour on increment (e.g. 23:59:59 wrapping to 00:00:00) — including reflection-based tests that exercise a private setTime() method directly. Test coverage was measured with JaCoCo, and the methodology (unit, integration, system and regression testing) was written up in an accompanying report.",
    tech: ["Java", "JUnit 5", "JaCoCo", "Reflection", "IntelliJ IDEA"],
    codeSnippet: null, codeSnippetLang: null,
    images: [],
    links: { repo: "https://github.com/viterUA/Software-Testing-CA-Y2", live: null },
    demo: {
      type: "custom",
      note: "Mirrors the real JUnit cases: out-of-range values reset to 0 on Set Time, and seconds/minutes/hours roll over exactly like the testIncrementHoursRollover()-style tests.",
      render(container) {
        let h = 0, m = 0, s = 0;
        const hIn = numberInput("clockH", 0);
        const mIn = numberInput("clockM", 0);
        const sIn = numberInput("clockS", 0);
        const out = output("The current time is : 00:00:00");

        function pad(n) { return String(n).padStart(2, "0"); }
        function print() { out.textContent = "The current time is : " + pad(h) + ":" + pad(m) + ":" + pad(s); }

        container.append(
          row([label("Hours", "clockH"), hIn, label("Minutes", "clockM"), mIn, label("Seconds", "clockS"), sIn]),
          row([
            button("Set Time", function () {
              const hv = Number(hIn.value), mv = Number(mIn.value), sv = Number(sIn.value);
              h = (hv >= 0 && hv <= 23) ? hv : 0;
              m = (mv >= 0 && mv <= 59) ? mv : 0;
              s = (sv >= 0 && sv <= 59) ? sv : 0;
              print();
            }),
            button("+1 Second (test rollover)", function () {
              s++; if (s > 59) { s = 0; m++; if (m > 59) { m = 0; h++; if (h > 23) h = 0; } }
              print();
            }, { secondary: true })
          ]),
          out
        );
      }
    }
  });

  PROJECTS.push({
    id: "y2s1-re-viter-game-store-design",
    title: "Viter Game Store — Requirements Engineering Design Document",
    year: 2, semester: 1, course: "Requirements Engineering", type: "non-code",
    description: "Requirements Engineering coursework analysing and designing a fictional video-game retail system. Covers high-level user requirements, a system-level use case diagram, and around 13 detailed use-case narratives (Add/Update/Remove Game, Manage Accounts, Sell/Return Games, Revenue Analysis) each with preconditions and step-by-step scenarios, plus planned data-flow diagrams and a UML class diagram for the underlying database schema.",
    tech: ["Requirements Engineering", "UML", "Use Case Modelling", "Data Flow Diagrams (DFD)"],
    codeSnippet: null, codeSnippetLang: null,
    images: ["assets/images/re-game-store/use-case-diagram.jpg"],
    links: { repo: null, live: null }
  });

  PROJECTS.push({
    id: "y2s1-re-viter-game-store-prototype",
    title: "Viter Game Store — WinForms UI Prototype",
    year: 2, semester: 1, course: "Requirements Engineering", type: "code",
    description: "Visual Studio WinForms prototype implementing the screens from the Viter Game Store requirements: a main menu routing to Add/Update/Remove Game, Add/Update/Close Account and Sale Game forms. Reproduces the field-level validation rules from the use-case narratives (required fields, non-numeric checks, rate must be > 0), but is a UI-only prototype — nothing is persisted yet. Later built out into a fully working app for Software Engineering Project.",
    tech: ["C#", ".NET Framework", "WinForms", "Visual Studio"],
    codeSnippet: "private void btnAdd_Click(object sender, EventArgs e)\n{\n    if (txtName.Text.Equals(\"\"))\n    {\n        MessageBox.Show(\"Name Must be entered\", \"Error\",\n        MessageBoxButtons.OK, MessageBoxIcon.Error);\n        txtName.Focus();\n        return;\n    }\n}",
    codeSnippetLang: "csharp",
    images: [],
    links: { repo: "https://github.com/viterUA/Requirements-Engineering-CA-F-Y2", live: null },
    demo: {
      type: "custom",
      note: "The 'Add Game' screen's validation rules, re-created as a plain HTML form with inline errors instead of MessageBox popups.",
      render(container) {
        const name = textInput("gName", "Game name");
        const desc = textInput("gDesc", "Description");
        const rate = numberInput("gRate", "", { min: 0, step: "0.01" });
        const out = output("");

        container.append(
          row([label("Name", "gName"), name]),
          row([label("Description", "gDesc"), desc]),
          row([label("Rate (€)", "gRate"), rate]),
          row([button("Add Game", function () {
            if (!name.value.trim()) { out.textContent = "Error: Name must be entered."; return; }
            if (desc.value.trim() && !isNaN(Number(desc.value.trim()))) { out.textContent = "Error: Description must not be purely numeric."; return; }
            if (!(Number(rate.value) > 0)) { out.textContent = "Error: Rate must be greater than 0."; return; }
            out.textContent = "\"" + name.value + "\" added (session only — not persisted, same as this UI-only prototype).";
          })]),
          out
        );
      }
    }
  });

  // Real static site — embedded as-is via iframe rather than simulated.
  PROJECTS.push({
    id: "y2s1-scripting-millionaire-game",
    title: "Who Wants to Be a Millionaire — Browser Quiz Game",
    year: 2, semester: 1, course: "Scripting", type: "code",
    description: "A fully playable, single-player browser recreation of \"Who Wants to Be a Millionaire\". A player enters their name, then answers up to 15 multiple-choice questions randomly drawn from a 25-question bank against a 15-second countdown timer, climbing a £100-to-£1,000,000 money ladder with safe points at questions 5, 10 and 15. Three lifelines are implemented (50:50, Ask the Audience, Phone a Friend), and results are handed off via localStorage to a summary page.",
    tech: ["HTML", "CSS", "JavaScript", "Web Storage API (localStorage)"],
    codeSnippet: "function fiftyFiftyChance(){\n    if (fiftyFiftyChanceUsed) return;\n    const currentQuestion = question15[currentQuestionIndex];\n    const correctAnswerIndex = currentQuestion.correctAnswer;\n    const incorrectAnswers = [0,1,2,3].filter(i => i !== correctAnswerIndex);\n    const answersToRemove = incorrectAnswers.sort(() => Math.random() - 0.5).slice(0, 2);\n    answersToRemove.forEach(index => {\n        const button = document.querySelectorAll(\".answer-button\")[index];\n        button.textContent = \"\";\n        button.disabled = true;\n    });\n}",
    codeSnippetLang: "javascript",
    images: ["assets/images/scripting-game/title-screen.png"],
    links: { repo: null, live: null },
    demo: {
      type: "iframe",
      src: "assets/demos/scripting-game/introduction.html",
      sameOrigin: true,  // needs localStorage; loads no third-party code (see demoIframe in app.js)
      note: "The actual submitted game — open it full screen, enter a name to start, then play through the real questions and lifelines."
    }
  });

  /* =======================================================================
     YEAR 2 — SEMESTER 2
     ======================================================================= */

  PROJECTS.push({
    id: "y2s2-se-viter-game-store-app",
    title: "Viter Game Store — Full WinForms Application",
    year: 2, semester: 2, course: "Software Engineering Project", type: "code",
    description: "Software Engineering Project build-out of the Year 2 Requirements Engineering prototype into a genuinely working desktop application. Adds a data layer that loads/saves Categories, Games, Accounts, Sales and Returns as text files. The Sell Game screen performs a real checkout with cart, buyer lookup and loyalty points. Two LINQ-driven analytics screens were added: Yearly Revenue Analysis and Games Analysis, ranking games by units sold.",
    tech: ["C#", ".NET Framework", "WinForms", "LINQ"],
    codeSnippet: "var ranking = DataStore.GetSales()\n    .Where(s => s.PurchaseDate.Year == year && games.ContainsKey(s.GameId))\n    .GroupBy(s => s.GameId)\n    .Select(g => new {\n        Game = games[g.Key].Name,\n        UnitsSold = g.Count(),\n        Revenue = g.Sum(s => s.Amount)\n    })\n    .OrderByDescending(r => r.UnitsSold)\n    .ToList();\n\ndgvGames.DataSource = ranking;",
    codeSnippetLang: "csharp",
    images: ["assets/images/se-game-store/games-analysis.jpg", "assets/images/se-game-store/revenue-2024.png"],
    links: { repo: "https://github.com/viterUA/Software-Engineering-Project", live: null },
    demo: {
      type: "custom",
      note: "The same GroupBy → OrderByDescending pipeline as the LINQ analytics screen, over a small mock sales dataset.",
      render(container) {
        const sales = [
          { year: 2022, game: "Star Racer", units: 12 }, { year: 2022, game: "Dungeon Deep", units: 7 },
          { year: 2023, game: "Star Racer", units: 20 }, { year: 2023, game: "Puzzle Isle", units: 15 },
          { year: 2024, game: "Puzzle Isle", units: 30 }, { year: 2024, game: "Dungeon Deep", units: 18 },
          { year: 2024, game: "Star Racer", units: 9 }
        ];
        const yearSel = select("yearSel", [{ value: "2022", text: "2022" }, { value: "2023", text: "2023" }, { value: "2024", text: "2024" }]);
        const tableWrap = el("div");

        function refresh() {
          const year = Number(yearSel.value);
          const totals = {};
          sales.filter(s => s.year === year).forEach(s => { totals[s.game] = (totals[s.game] || 0) + s.units; });
          const ranking = Object.entries(totals).sort((a, b) => b[1] - a[1]);
          tableWrap.innerHTML = "";
          tableWrap.append(el("table", { class: "demo-table" }, [
            el("tr", {}, [el("th", { text: "Game" }), el("th", { text: "Units Sold" })]),
            ...ranking.map(([game, units]) => el("tr", {}, [el("td", { text: game }), el("td", { text: String(units) })]))
          ]));
        }
        yearSel.addEventListener("change", refresh);
        refresh();
        container.append(row([label("Year", "yearSel"), yearSel]), tableWrap);
      }
    }
  });

  PROJECTS.push({
    id: "y2s2-se-viter-game-store-design",
    title: "Viter Game Store — Software Engineering Project Design Document",
    year: 2, semester: 2, course: "Software Engineering Project", type: "non-code",
    description: "Finalised requirements/design document used as the blueprint for the Software Engineering Project WinForms build. Expands the Semester 1 draft with a fuller system overview, refined use-case narratives for all four modules (Games, Accounts, Sales, Admin reporting), and Level-0 through Level-2 data-flow diagrams plus the UML class diagram and relational schema.",
    tech: ["Requirements Engineering", "UML", "Use Case Modelling", "Data Flow Diagrams (DFD)"],
    codeSnippet: null, codeSnippetLang: null,
    images: [],
    links: { repo: null, live: null }
  });

  /* =======================================================================
     YEAR 3 — SEMESTER 1
     ======================================================================= */

  PROJECTS.push({
    id: "y3s1-data-analysis-employee-attrition",
    title: "Employee Attrition Prediction — A CRISP-DM Analysis",
    year: 3, semester: 1, course: "Data Analysis", type: "non-code",
    description: "A continual-assessment report applying the CRISP-DM methodology to the IBM HR Analytics Employee Attrition dataset: recoding the outcome into a binary flag, engineering interpretable features such as income and age bands, and training Random Forest, Gradient Boosting, and a stacking ensemble to predict which employees are likely to leave. Evaluated with accuracy, precision, recall, F1 and ROC-AUC on an 80/20 split; overtime status, income band, job role and years at company were the strongest predictors.",
    tech: ["Python", "pandas", "scikit-learn", "Random Forest", "Gradient Boosting", "CRISP-DM"],
    codeSnippet: null, codeSnippetLang: null,
    images: [],
    links: { repo: null, live: null }
  });

  PROJECTS.push({
    id: "y3s1-data-structures-spellcheck-benchmark",
    title: "SpellCheck: Java Collections Performance Benchmark",
    year: 3, semester: 1, course: "Data Structures & Concurrency", type: "code",
    description: "A Java console application that spell-checks the full text of Moby Dick against a 122,790-word dictionary, loading it into five different Collection implementations (LinkedList, ArrayList with/without binary search, TreeSet, HashSet) and timing how long each one's lookup takes. Benchmarks showed contains() on LinkedList taking ~77,577ms versus ~16ms for HashSet — a hands-on demonstration of O(n) vs O(log n) vs O(1) lookup complexity.",
    tech: ["Java", "Java Collections Framework", "Big-O Analysis"],
    codeSnippet: "public static int spellCheck(Collection<String> dictionary, List<String> textWords, boolean useBinarySearch) {\n    int misspelled = 0;\n    if (useBinarySearch && dictionary instanceof List) {\n        List<String> dictList = (List<String>) dictionary;\n        for (String word : textWords) {\n            if (Collections.binarySearch(dictList, word) < 0) misspelled++;\n        }\n    } else {\n        for (String word : textWords) {\n            if (!dictionary.contains(word)) misspelled++;\n        }\n    }\n    return misspelled;\n}",
    codeSnippetLang: "java",
    images: [],
    links: { repo: "https://github.com/viterUA/Algorythm-And-Data-Stracture-CA-Y2", live: null },
    demo: {
      type: "custom",
      note: "The same O(n) vs O(1) idea, timed live in the browser: Array.includes() vs Set.has() over 20,000 generated words.",
      render(container) {
        const words = Array.from({ length: 20000 }, (_, i) => "word" + i);
        const wordSet = new Set(words);
        const out = output("Click Run to benchmark.");

        container.append(row([button("Run Benchmark", function () {
          const lookups = Array.from({ length: 4000 }, () => "word" + Math.floor(Math.random() * 24000));

          const t0 = performance.now();
          let arrHits = 0;
          lookups.forEach(w => { if (words.includes(w)) arrHits++; });
          const t1 = performance.now();

          let setHits = 0;
          lookups.forEach(w => { if (wordSet.has(w)) setHits++; });
          const t2 = performance.now();

          out.textContent =
            "Array.includes(): " + (t1 - t0).toFixed(1) + "ms\n" +
            "Set.has():        " + (t2 - t1).toFixed(1) + "ms\n" +
            "Set was ~" + Math.max(1, Math.round((t1 - t0) / Math.max(0.1, t2 - t1))) + "x faster";
        })]), out);
      }
    }
  });

  PROJECTS.push({
    id: "y3s1-professional-development-portfolio",
    title: "Professional Development Portfolio — Reflective Journals & Video Pitch",
    year: 3, semester: 1, course: "Professional Development", type: "non-code",
    description: "Four reflective journals tracking job-search and professional-growth activities across the semester: preparing and tailoring a CV, interview experiences at several companies that ultimately led to a work-placement offer at SMBC, and a reflection on a guest talk about pitching and communication skills. Also includes a scripted, recorded 60-second video pitch introducing technical background and the goal of becoming a well-rounded full-stack developer.",
    tech: ["Professional Development", "Interview Preparation", "Communication Skills"],
    codeSnippet: null, codeSnippetLang: null,
    images: [],
    links: { repo: null, live: null }
  });

  PROJECTS.push({
    id: "y3s1-ooad-task-manager",
    title: "Task Manager — SOLID-Principles Console App (OOAD Group Project)",
    year: 3, semester: 1, course: "OOAD", type: "code",
    description: "A console-based task manager built for the Object-Oriented Analysis & Design group project (CA2), structured around SOLID principles: Task is a plain model behind a BaseEntity, TaskRepository implements an ITaskRepository interface so the persistence layer can be swapped without touching business logic, and TaskService depends only on that abstraction (DIP) while staying free of UI or storage concerns (SRP). Filtering is implemented as a Strategy pattern — an ITaskFilter interface with PriorityFilter and StatusFilter implementations — so new filter types plug in without modifying TaskService (OCP). Menu/Input/Display handler classes separate console I/O from logic, and the group's design was modelled with a PlantUML class diagram.",
    tech: ["Java", "SOLID Principles", "Strategy Pattern", "PlantUML", "IntelliJ IDEA", "Git"],
    codeSnippet: "/**\n * OCP + Polymorphism: Applies any ITaskFilter implementation to the current tasks.\n * DIP: Depends on ITaskFilter abstraction so new filters can be introduced without changing this method.\n */\npublic List<Task> applyFilter(ITaskFilter filter) {\n    List<Task> allTasks = repository.getAll();\n    return filter.filter(allTasks);\n}",
    codeSnippetLang: "java",
    images: [],
    links: { repo: "https://github.com/viterUA/OOAD-Group-2-Project-CA2", live: null },
    demo: {
      type: "custom",
      note: "A simplified stand-in for TaskService's filterByStatus — add tasks, then filter the list and click a status to cycle it (Pending → In Progress → Completed).",
      render(container) {
        const tasks = [];
        let nextId = 1;
        let statusFilter = "ALL";
        const titleIn = textInput("taskTitle", "Task title");
        const prioritySel = select("taskPriority", [
          { value: "LOW", text: "Low" }, { value: "MEDIUM", text: "Medium" },
          { value: "HIGH", text: "High" }, { value: "URGENT", text: "Urgent" }
        ]);
        const tableWrap = el("div");

        function refresh() {
          const visible = statusFilter === "ALL" ? tasks : tasks.filter(t => t.status === statusFilter);
          tableWrap.innerHTML = "";
          if (!visible.length) { tableWrap.append(el("p", { class: "demo-note", text: "No tasks match this filter." })); return; }
          tableWrap.append(el("table", { class: "demo-table" }, [
            el("tr", {}, [el("th", { text: "Task" }), el("th", { text: "Priority" }), el("th", { text: "Status (click to cycle)" })]),
            ...visible.map(t => el("tr", {}, [
              el("td", { text: t.title }),
              el("td", { text: t.priority }),
              el("td", { text: t.status, style: "cursor:pointer;text-decoration:underline;", onclick: function () {
                const order = ["PENDING", "IN_PROGRESS", "COMPLETED"];
                t.status = order[(order.indexOf(t.status) + 1) % order.length];
                refresh();
              } })
            ]))
          ]));
        }

        container.append(
          row([label("Title", "taskTitle"), titleIn, label("Priority", "taskPriority"), prioritySel,
            button("+ Add Task", function () {
              if (!titleIn.value.trim()) return;
              tasks.push({ id: nextId++, title: titleIn.value.trim(), priority: prioritySel.value, status: "PENDING" });
              titleIn.value = "";
              refresh();
            })]),
          row([
            button("All", function () { statusFilter = "ALL"; refresh(); }, { secondary: true }),
            button("Pending", function () { statusFilter = "PENDING"; refresh(); }, { secondary: true }),
            button("In Progress", function () { statusFilter = "IN_PROGRESS"; refresh(); }, { secondary: true }),
            button("Completed", function () { statusFilter = "COMPLETED"; refresh(); }, { secondary: true })
          ]),
          tableWrap
        );
        refresh();
      }
    }
  });

  PROJECTS.push({
    id: "y3s1-software-tools-phpbank-core-banking",
    title: "PHP BANK — Laravel Online Banking App (Group Project)",
    year: 3, semester: 1, course: "Software Tools", type: "code",
    description: "A three-person team project: a full online-banking web app built with Laravel, Blade and Tailwind CSS. Users register (18+ age check, unique email and phone), log in, and manage their account from a dashboard showing balance, last transaction, last login and 2FA status. Top-ups go through a validated mock card form (€5–€9,999.99, 16-digit card, 3-digit CVV, expiry no more than 15 years ahead); transfers go to another customer by email (€1–€999,999.99, balance checked, self-transfers blocked). Each money movement runs inside DB::transaction() with bcadd() for exact decimal arithmetic, so both balances and the matching transaction records are written together or not at all. Users can also change their email or password and review their full history. The project ships with Docker, database migrations, seeders and factories, PHPUnit tests, and CI/CD through GitHub Actions and Azure Pipelines deploying to Azure App Service.",
    tech: ["PHP", "Laravel", "Blade", "Tailwind CSS", "Eloquent ORM", "MySQL", "PHPUnit", "Docker", "GitHub Actions", "Azure"],
    codeSnippet: "public function deposit(float $amount, string $description = 'Account Top-Up')\n{\n    DB::transaction(function () use ($amount, $description){\n        $this->balance = bcadd($this->balance, $amount, 2);\n        $this->save();\n\n        Transaction::create([\n            'account_id' => $this->account_id,\n            'type' => 'Deposit',\n            'amount' => $amount,\n            'balance_after' => $this->balance,\n        ]);\n    });\n}",
    codeSnippetLang: "php",
    images: ["assets/images/phpbank/account-page.svg", "assets/images/phpbank/transactions.svg"],
    links: { repo: "https://github.com/olezkabodnar/phpbank", live: null },
    // The Laravel app needs a PHP server + database, so the portfolio embeds a
    // browser-only replica (assets/demos/phpbank/) with the same screens and rules.
    demo: {
      type: "iframe",
      src: "assets/demos/phpbank/index.html",
      note: "A browser-only replica of the app, with the same screens, design and validation rules. Log in with the demo account (shown on the login screen) to top up, transfer between accounts, view transactions, or change your email or password. Data stays in your browser tab and resets on reload."
    }
  });

  PROJECTS.push({
    id: "y3s1-software-tools-phpbank-auth-2fa",
    title: "PHP BANK — Authentication & Two-Factor Security",
    year: 3, semester: 1, course: "Software Tools", type: "code",
    description: "The security layer of the PHP BANK Laravel app. Registration validates every field (18+ date-of-birth rule, unique email and phone, confirmed password of at least 6 characters), and passwords are stored hashed with Laravel's Hash facade. Login gives the same message for an unknown email or a wrong password, so it doesn't reveal which accounts exist, and it rejects inactive accounts before starting a session. Every account page checks the session first. A separate TwoFAService lets users switch email-based two-factor authentication on or off from a settings page and send themselves a test code. Codes are 6 digits from random_int(), expire after 10 minutes, replace any earlier unused code, are cleared when 2FA is switched off, and are delivered through a Laravel Mailable (TwoFACodeMail).",
    tech: ["PHP", "Laravel", "Laravel Mail", "Hash Facade", "Sessions", "Service classes"],
    codeSnippet: "public function toggle(Request $request)\n{\n    $account = $this->getCurrentAccount();\n    $isEnabled = $this->twoFAService->isEnabled($account);\n    $success = $isEnabled\n        ? $this->twoFAService->disable($account)\n        : $this->twoFAService->enable($account);\n\n    $message = $isEnabled ? 'Two-Factor Authentication disabled.' : 'Two-Factor Authentication enabled.';\n    return redirect()->route('2fa.settings')->with('success', $message);\n}",
    codeSnippetLang: "php",
    images: ["assets/images/phpbank/2fa-page.svg"],
    links: { repo: "https://github.com/olezkabodnar/phpbank", live: null },
    demo: {
      type: "iframe",
      src: "assets/demos/phpbank/index.html#2fa",
      note: "Opens the PHP BANK replica on its 2FA settings page, already signed in as the demo user. Turn 2FA on, then send a test code; it arrives in a simulated inbox. Sign Off to try registering (the 18+ rule) or logging in with a wrong password."
    }
  });

  PROJECTS.push({
    id: "y3s1-web-frameworks-upl-standings",
    title: "Ukrainian Premier League Standings App",
    year: 3, semester: 1, course: "Web Frameworks", type: "code",
    description: "A Node.js/Express server-rendered web app (Pug templates, Bootstrap 5) showcasing Ukrainian Premier League clubs, league standings, and top strikers, backed by an internal REST API built with Express + Mongoose over MongoDB. The homepage controller fetches all clubs and highlights Dynamo Kyiv, Shakhtar Donetsk, Oleksandriya and Polissya Zhytomyr for its hero section.",
    tech: ["Node.js", "Express", "Pug", "MongoDB", "Mongoose", "Bootstrap 5"],
    codeSnippet: "module.exports.getStandings = async function (req, res) {\n  try {\n      const standings = await Standings.find().lean();\n      res.json(standings);\n  } catch (err) {\n      res.status(500).json({ error: err.message });\n  }\n};",
    codeSnippetLang: "javascript",
    images: ["assets/images/web-frameworks-upl/dynamo-kyiv.jpg", "assets/images/web-frameworks-upl/shakhtar.jpg"],
    links: { repo: "https://github.com/viterUA/Web-Framework-Project-Y3", live: "https://helloexpress-mykhailohnylytskyi.onrender.com" },
    demo: {
      type: "custom",
      note: "A sortable standings table, standing in for the real /api/standings-backed page (click a column to sort).",
      render(container) {
        const clubs = [
          { name: "Dynamo Kyiv", played: 20, won: 15, drawn: 3, lost: 2, points: 48 },
          { name: "Shakhtar Donetsk", played: 20, won: 14, drawn: 4, lost: 2, points: 46 },
          { name: "Polissya Zhytomyr", played: 20, won: 10, drawn: 6, lost: 4, points: 36 },
          { name: "Oleksandriya", played: 20, won: 9, drawn: 5, lost: 6, points: 32 }
        ];
        const tableWrap = el("div");
        function renderTable(sortKey) {
          const sorted = [...clubs].sort((a, b) => b[sortKey] - a[sortKey]);
          tableWrap.innerHTML = "";
          tableWrap.append(el("table", { class: "demo-table" }, [
            el("tr", {}, [
              el("th", { text: "Club" }),
              el("th", { text: "P", style: "cursor:pointer;", onclick: () => renderTable("played") }),
              el("th", { text: "W", style: "cursor:pointer;", onclick: () => renderTable("won") }),
              el("th", { text: "Pts", style: "cursor:pointer;", onclick: () => renderTable("points") })
            ]),
            ...sorted.map(c => el("tr", {}, [el("td", { text: c.name }), el("td", { text: String(c.played) }), el("td", { text: String(c.won) }), el("td", { text: String(c.points) })]))
          ]));
        }
        renderTable("points");
        container.append(el("p", { class: "demo-note", text: "Click a column header to sort." }), tableWrap);
      }
    }
  });

  /* =======================================================================
     YEAR 3 — SEMESTER 2
     ======================================================================= */

  PROJECTS.push({
    id: "y3s2-work-placement-smbc-oracle-dba",
    title: "Work Placement — Oracle Database Administration at SMBC",
    year: 3, semester: 2, course: "Work Placement", type: "non-code",
    description: "A semester-long industry placement on the Oracle Database Administration team at SMBC, covering Oracle and Linux system administration, user/access management, tablespace encryption, schema export/import, and daily Bash-scripted health checks. Also built an extended health-check script with a regression manual, and a Python/GraphQL reporting script; co-ran a QA workshop for MTU students. The final report scores progress against 7 learning goals set at the start of the placement.",
    tech: ["Oracle Database", "Linux", "SQL", "Bash", "Python", "GraphQL"],
    codeSnippet: null, codeSnippetLang: null,
    images: [],
    links: { repo: null, live: null }
  });

  /* =======================================================================
     DIPLOMA PROJECT
     ======================================================================= */

  PROJECTS.push({
    id: "diploma-skarbnychka",
    title: "Скарбничка (\"Piggy Bank\") — Personal Finance Web App",
    year: "diploma", semester: null,
    course: "Final Diploma Project — Information System for Personal Finance Planning & Optimisation",
    type: "code",
    description: "A cloud-based personal finance web app built as the final diploma project. Users log income and expenses against custom categories, track a running balance, and set a monthly spending limit that turns the budget bar red once exceeded. Spending and income breakdowns are visualised with hand-built SVG pie charts (no charting library). Sign-in is via Google OAuth through Firebase Authentication, with a no-signup 'Guest' mode for trying the app with temporary demo data. Data lives in Cloud Firestore in per-user collections locked down by Firestore Security Rules and syncs in real time across devices. The app is deployed on Vercel with a GitHub-based CI/CD pipeline, and the full transaction history can be exported to Excel/CSV for offline analysis.",
    tech: ["React", "Vite", "Tailwind CSS", "Firebase Authentication", "Cloud Firestore", "Vercel", "SVG"],
    codeSnippet: null, codeSnippetLang: null,
    images: [
      "assets/images/diploma/skarbnychka-login.png",
      "assets/images/diploma/skarbnychka-reports.png",
      "assets/images/diploma/skarbnychka-income.png"
    ],
    links: { repo: null, live: "https://diploma-skarb.vercel.app/" },
    demo: {
      type: "custom",
      note: "A simplified re-creation of the budget tracker's core idea — not the real app's code, just the same add-a-transaction / watch-the-budget-bar behaviour shown in the screenshots above.",
      render(container) {
        let balance = 25000, spent = 0, budget = 15000;
        const categories = {};

        const descIn = textInput("txDesc", "What was it for?");
        const typeSel = select("txType", [{ value: "expense", text: "Expense" }, { value: "income", text: "Income" }]);
        const catSel = select("txCat", [
          { value: "Food", text: "Food" }, { value: "Transport", text: "Transport" },
          { value: "Sport & Hobby", text: "Sport & Hobby" }, { value: "Salary", text: "Salary" }, { value: "Gift", text: "Gift" }
        ]);
        const amtIn = numberInput("txAmt", "", { min: 0 });

        const statBalance = el("span", { class: "demo-stat-value", text: "€" + balance.toLocaleString() });
        const statSpent = el("span", { class: "demo-stat-value", text: "€0" });
        const budgetBar = el("div");
        const catList = el("div");

        function refresh() {
          statBalance.textContent = "€" + balance.toLocaleString();
          statSpent.textContent = "€" + spent.toLocaleString();
          const pct = budget > 0 ? (spent / budget) * 100 : 0;
          statSpent.className = "demo-stat-value" + (pct >= 100 ? " is-warning" : "");
          budgetBar.innerHTML = "";
          budgetBar.append(
            el("p", { class: "demo-note", text: "Budget used: " + Math.round(pct) + "% of €" + budget.toLocaleString() }),
            bar(pct, pct >= 100)
          );
          catList.innerHTML = "";
          const total = Object.values(categories).reduce((a, b) => a + b, 0) || 1;
          Object.entries(categories).forEach(function ([cat, amt]) {
            catList.append(
              el("div", { style: "display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:4px;" }, [
                el("span", { text: cat }), el("span", { text: "€" + amt + " (" + Math.round((amt / total) * 100) + "%)" })
              ]),
              bar((amt / total) * 100)
            );
          });
        }

        container.append(
          row([label("Description", "txDesc"), descIn]),
          row([label("Type", "txType"), typeSel, label("Category", "txCat"), catSel, label("Amount (₴)", "txAmt"), amtIn]),
          row([button("+ Add", function () {
            const amt = Number(amtIn.value) || 0;
            if (amt <= 0) return;
            if (typeSel.value === "income") { balance += amt; }
            else { balance -= amt; spent += amt; categories[catSel.value] = (categories[catSel.value] || 0) + amt; }
            amtIn.value = ""; descIn.value = "";
            refresh();
          })]),
          el("div", { class: "demo-piggy-summary" }, [
            el("div", { class: "demo-stat" }, [el("span", { class: "demo-stat-label", text: "Balance" }), statBalance]),
            el("div", { class: "demo-stat" }, [el("span", { class: "demo-stat-label", text: "Spent this month" }), statSpent])
          ]),
          budgetBar,
          catList
        );
        refresh();
      }
    }
  });

  return PROJECTS;
})();
