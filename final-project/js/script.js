const STORAGE_KEYS = Object.freeze({
    theme: "coffeeShop.theme",
    users: "coffeeShop.users",
    session: "coffeeShop.session",
    menuSearch: "coffeeShop.menuSearch",
    menuCategory: "coffeeShop.menuCategory"
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]{6,18}[0-9]$/;

function readStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

function removeStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch {
        return false;
    }
}

function readJson(key, fallback) {
    const value = readStorage(key);
    if (!value) {
        return fallback;
    }
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

function applyTheme(theme) {
    const themeName = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = themeName;
    document.documentElement.style.colorScheme = themeName;
}

function getSavedTheme() {
    const savedTheme = readStorage(STORAGE_KEYS.theme);
    if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
    }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function setupThemeToggle() {
    const toggle = document.getElementById("theme-toggle");
    if (!toggle) {
        return;
    }
    const label = toggle.querySelector("[data-theme-label]");
    const syncToggle = () => {
        const isDark = document.documentElement.dataset.theme === "dark";
        toggle.setAttribute("aria-checked", String(isDark));
        if (label) {
            label.textContent = isDark ? "Dark" : "Light";
        }
    };
    toggle.addEventListener("click", () => {
        const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
        writeStorage(STORAGE_KEYS.theme, nextTheme);
        syncToggle();
    });
    syncToggle();
}

function getUsers() {
    const users = readJson(STORAGE_KEYS.users, []);
    if (!Array.isArray(users)) {
        return [];
    }
    return users.filter(user => user && typeof user.email === "string");
}

function getCurrentUser() {
    const session = readJson(STORAGE_KEYS.session, null);
    if (!session || typeof session.email !== "string") {
        return null;
    }
    const email = session.email.toLowerCase();
    return getUsers().find(user => user.email.toLowerCase() === email) || null;
}

function updateAuthLink() {
    const link = document.querySelector("[data-auth-link]");
    if (!link) {
        return;
    }
    const user = getCurrentUser();
    const currentPage = document.body.dataset.page;
    link.textContent = user ? "Profile" : "Log in";
    link.href = user ? "profile.html" : "login.html";
    const isCurrent = user ? currentPage === "profile" : currentPage === "login";
    link.classList.toggle("active", isCurrent);
    if (isCurrent) {
        link.setAttribute("aria-current", "page");
    } else {
        link.removeAttribute("aria-current");
    }
}

const MENU_ITEMS = [
    { name: "Espresso", category: "Coffee", size: "60 ml", price: 700, description: "A short, rich shot." },
    { name: "Americano", category: "Coffee", size: "250 ml", price: 900, description: "Espresso topped up with hot water." },
    { name: "Cappuccino", category: "Coffee", size: "250 ml", price: 1200, description: "Espresso, steamed milk and soft foam." },
    { name: "Latte", category: "Coffee", size: "300 ml", price: 1400, description: "A smooth, mellow milk coffee." },
    { name: "Hot chocolate", category: "Other drinks", size: "250 ml", price: 1100, description: "Warm milk and cocoa." },
    { name: "Black tea", category: "Other drinks", size: "350 ml", price: 600, description: "A freshly brewed pot." },
    { name: "Butter croissant", category: "Snacks", size: "1 piece", price: 800, description: "Flaky pastry with a golden crust." },
    { name: "Chocolate cookie", category: "Snacks", size: "1 cookie", price: 500, description: "Soft-baked with dark chocolate." }
];

function createMenuCard(item) {
    const card = document.createElement("article");
    card.className = "menu-item";
    const head = document.createElement("div");
    head.className = "menu-item-head";
    const name = document.createElement("h3");
    name.textContent = item.name;
    const price = document.createElement("p");
    price.className = "menu-price";
    price.textContent = `${item.price.toLocaleString("en-US")} KZT`;
    head.append(name, price);
    const description = document.createElement("p");
    description.className = "menu-desc";
    description.textContent = item.description;
    const meta = document.createElement("p");
    meta.className = "menu-meta";
    meta.textContent = `${item.size} · ${item.category}`;
    card.append(head, description, meta);
    return card;
}

function setupMenu() {
    const menuGrid = document.getElementById("menu-list");
    if (!menuGrid) {
        return;
    }
    const search = document.getElementById("menu-search");
    const count = document.getElementById("menu-count");
    const empty = document.getElementById("menu-empty");
    const clear = document.getElementById("menu-clear");
    const buttons = Array.from(document.querySelectorAll("[data-filter]"));
    const savedCategory = readStorage(STORAGE_KEYS.menuCategory);
    let category = buttons.some(button => button.dataset.filter === savedCategory) ? savedCategory : "all";
    search.value = readStorage(STORAGE_KEYS.menuSearch) || "";

    const update = () => {
        const query = search.value.trim().toLowerCase();
        const visibleItems = MENU_ITEMS.filter(item => {
            const matchesCategory = category === "all" || item.category === category;
            const itemText = `${item.name} ${item.description} ${item.size} ${item.category}`.toLowerCase();
            return matchesCategory && itemText.includes(query);
        });
        menuGrid.replaceChildren(...visibleItems.map(createMenuCard));
        menuGrid.hidden = visibleItems.length === 0;
        empty.hidden = visibleItems.length !== 0;
        count.textContent = `Showing ${visibleItems.length} of ${MENU_ITEMS.length} items`;
        buttons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.filter === category)));
        writeStorage(STORAGE_KEYS.menuSearch, search.value);
        writeStorage(STORAGE_KEYS.menuCategory, category);
    };

    search.addEventListener("input", update);
    buttons.forEach(button => {
        button.addEventListener("click", () => {
            category = button.dataset.filter;
            update();
        });
    });
    clear.addEventListener("click", () => {
        search.value = "";
        category = "all";
        update();
        search.focus();
    });
    update();
}

function isTrustworthyCoffee(item) {
    return item && typeof item.title === "string" && item.title.trim() &&
        typeof item.description === "string" && item.description.trim() &&
        Array.isArray(item.ingredients) &&
        item.ingredients.some(ingredient => typeof ingredient === "string" && ingredient.trim());
}

function createGuideCard(item) {
    const card = document.createElement("article");
    card.className = "guide-card";
    const title = document.createElement("h3");
    title.textContent = item.title.trim();
    const ingredients = document.createElement("p");
    ingredients.className = "ingredients";
    const list = item.ingredients
        .filter(ingredient => typeof ingredient === "string" && ingredient.trim())
        .map(ingredient => ingredient.trim());
    ingredients.textContent = `Ingredients: ${list.join(", ")}`;
    const description = document.createElement("p");
    description.textContent = item.description.trim();
    card.append(title, ingredients, description);
    return card;
}

function setupCoffeeGuide() {
    const grid = document.getElementById("coffee-guide-grid");
    if (!grid) {
        return;
    }
    const loading = document.getElementById("coffee-loading");
    const error = document.getElementById("coffee-error");
    const empty = document.getElementById("coffee-empty");
    const retry = document.getElementById("coffee-retry");

    const loadGuide = async () => {
        loading.hidden = false;
        error.hidden = true;
        empty.hidden = true;
        grid.hidden = true;
        grid.replaceChildren();
        try {
            const response = await fetch("https://api.sampleapis.com/coffee/hot");
            if (!response.ok) {
                throw new Error("Coffee guide request failed");
            }
            const data = await response.json();
            if (!Array.isArray(data)) {
                throw new Error("Coffee guide returned an unexpected response");
            }
            const trustedItems = data.filter(isTrustworthyCoffee).slice(0, 6);
            grid.replaceChildren(...trustedItems.map(createGuideCard));
            grid.hidden = trustedItems.length === 0;
            empty.hidden = trustedItems.length !== 0;
        } catch {
            error.hidden = false;
        } finally {
            loading.hidden = true;
        }
    };

    retry.addEventListener("click", loadGuide);
    loadGuide();
}

function validateName(value) {
    return value.trim() ? "" : "Enter your name.";
}

function validateEmail(value) {
    const email = value.trim();
    if (!email) {
        return "Enter your email address.";
    }
    return EMAIL_PATTERN.test(email) ? "" : "Enter a valid email, for example name@example.com.";
}

function validatePhone(value) {
    const phone = value.trim();
    if (!phone) {
        return "Enter your phone number.";
    }
    const digits = phone.replace(/\D/g, "");
    const isValid = PHONE_PATTERN.test(phone) && digits.length >= 8 && digits.length <= 15;
    return isValid ? "" : "Use a valid phone number, for example +7 777 123 4567.";
}

function validatePassword(value) {
    if (!value) {
        return "Enter your password.";
    }
    const isValid = value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value);
    return isValid ? "" : "Use at least 8 characters with uppercase, lowercase and a number.";
}

function validateMessage(value) {
    return value.trim() ? "" : "Enter your message.";
}

function hideStatus(status) {
    if (status) {
        status.hidden = true;
        status.textContent = "";
    }
}

function showStatus(status, message, type) {
    if (!status) {
        return;
    }
    status.textContent = message;
    status.classList.remove("form-status--success", "form-status--error");
    status.classList.add(`form-status--${type}`);
    status.setAttribute("role", type === "error" ? "alert" : "status");
    status.hidden = false;
}

function setupForm(formId, fieldSpecs, onValid) {
    const form = document.getElementById(formId);
    if (!form) {
        return;
    }
    const status = form.querySelector(".form-status");
    const fields = fieldSpecs.map(([fieldId, validator]) => ({
        input: document.getElementById(fieldId),
        error: document.getElementById(`${fieldId}-error`),
        validator
    }));
    fields.forEach(field => {
        field.input.addEventListener("input", () => {
            field.error.textContent = "";
            field.input.classList.remove("is-invalid");
            field.input.removeAttribute("aria-invalid");
            hideStatus(status);
        });
    });
    form.addEventListener("submit", event => {
        event.preventDefault();
        hideStatus(status);
        let firstInvalid = null;
        fields.forEach(field => {
            const message = field.validator(field.input.value);
            field.error.textContent = message;
            field.input.classList.toggle("is-invalid", Boolean(message));
            if (message) {
                field.input.setAttribute("aria-invalid", "true");
                if (!firstInvalid) {
                    firstInvalid = field.input;
                }
            } else {
                field.input.removeAttribute("aria-invalid");
            }
        });
        if (firstInvalid) {
            firstInvalid.focus();
            return;
        }
        onValid({ form, status, fields });
    });
    return fields;
}

function setupContactForm() {
    if (!document.getElementById("contact-form")) {
        return;
    }
    const fieldSpecs = [
        ["contact-name", validateName],
        ["contact-email", validateEmail],
        ["contact-phone", validatePhone],
        ["contact-message", validateMessage]
    ];
    setupForm("contact-form", fieldSpecs, ({ form, fields }) => {
        const name = document.getElementById("contact-name").value.trim();
        form.reset();
        fields.forEach(field => {
            field.error.textContent = "";
            field.input.classList.remove("is-invalid");
            field.input.removeAttribute("aria-invalid");
        });
        showStatus(document.getElementById("contact-status"), `Thank you, ${name}. Your message has been sent.`, "success");
    });
}

function setupAuthPage() {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    if (!loginForm || !signupForm) {
        return;
    }
    const tabs = Array.from(document.querySelectorAll("[data-auth-tab]"));
    const loginStatus = document.getElementById("login-status");
    const signupStatus = document.getElementById("signup-status");

    const showForm = tabName => {
        tabs.forEach(tab => tab.setAttribute("aria-pressed", String(tab.dataset.authTab === tabName)));
        loginForm.hidden = tabName !== "login";
        signupForm.hidden = tabName !== "signup";
    };
    tabs.forEach(tab => tab.addEventListener("click", () => showForm(tab.dataset.authTab)));

    const loginSpecs = [
        ["login-email", validateEmail],
        ["login-password", validatePassword]
    ];
    setupForm("login-form", loginSpecs, ({ status }) => {
        const email = document.getElementById("login-email").value.trim().toLowerCase();
        const password = document.getElementById("login-password").value;
        const user = getUsers().find(candidate => candidate.email.toLowerCase() === email && candidate.password === password);
        if (!user) {
            showStatus(status, "Email or password is incorrect. Check your details and try again.", "error");
            return;
        }
        if (!writeStorage(STORAGE_KEYS.session, JSON.stringify({ email: user.email }))) {
            showStatus(status, "Your session could not be started in this browser.", "error");
            return;
        }
        window.location.assign("profile.html");
    });

    const signupSpecs = [
        ["signup-name", validateName],
        ["signup-email", validateEmail],
        ["signup-phone", validatePhone],
        ["signup-password", validatePassword],
        ["signup-confirm", value => {
            if (!value) {
                return "Confirm your password.";
            }
            return value === document.getElementById("signup-password").value ? "" : "Passwords do not match.";
        }]
    ];
    const signupFields = setupForm("signup-form", signupSpecs, ({ fields }) => {
        const emailInput = document.getElementById("signup-email");
        const email = emailInput.value.trim().toLowerCase();
        const users = getUsers();
        if (users.some(user => user.email.toLowerCase() === email)) {
            const emailField = fields.find(field => field.input === emailInput);
            emailField.error.textContent = "An account with this email already exists. Use the Log in tab.";
            emailInput.classList.add("is-invalid");
            emailInput.setAttribute("aria-invalid", "true");
            emailInput.focus();
            return;
        }
        users.push({
            name: document.getElementById("signup-name").value.trim(),
            email,
            phone: document.getElementById("signup-phone").value.trim(),
            password: document.getElementById("signup-password").value
        });
        if (!writeStorage(STORAGE_KEYS.users, JSON.stringify(users))) {
            showStatus(signupStatus, "Your account could not be saved in this browser.", "error");
            return;
        }
        signupForm.reset();
        signupFields.forEach(field => {
            field.error.textContent = "";
            field.input.classList.remove("is-invalid");
            field.input.removeAttribute("aria-invalid");
        });
        hideStatus(signupStatus);
        document.getElementById("login-email").value = email;
        showForm("login");
        showStatus(loginStatus, "Your account has been created. You can now log in.", "success");
        document.getElementById("login-password").focus();
    });
}

function setupProfile() {
    const loggedOut = document.getElementById("profile-logged-out");
    if (!loggedOut) {
        return;
    }
    const details = document.getElementById("profile-details");
    const user = getCurrentUser();
    if (user) {
        loggedOut.hidden = true;
        details.hidden = false;
        document.getElementById("profile-name").textContent = user.name;
        document.getElementById("profile-email").textContent = user.email;
        document.getElementById("profile-phone").textContent = user.phone;
    }
    document.getElementById("logout-button").addEventListener("click", () => {
        removeStorage(STORAGE_KEYS.session);
        window.location.assign("login.html");
    });
}

function startPage() {
    setupThemeToggle();
    updateAuthLink();
    setupMenu();
    setupCoffeeGuide();
    setupContactForm();
    setupAuthPage();
    setupProfile();
}

applyTheme(getSavedTheme());

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startPage);
} else {
    startPage();
}
