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
        return true;
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
    const selectedTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = selectedTheme;
    document.documentElement.style.colorScheme = selectedTheme;
}

function getInitialTheme() {
    const savedTheme = readStorage(STORAGE_KEYS.theme);
    if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
    }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initialiseTheme() {
    const toggle = document.getElementById("theme-toggle");
    if (!toggle) {
        return;
    }
    const label = toggle.querySelector("[data-theme-label]");
    const updateControl = () => {
        const isDark = document.documentElement.dataset.theme === "dark";
        toggle.setAttribute("aria-checked", String(isDark));
        label.textContent = isDark ? "Dark" : "Light";
        toggle.title = isDark ? "Switch to light mode" : "Switch to dark mode";
    };
    toggle.addEventListener("click", () => {
        const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
        writeStorage(STORAGE_KEYS.theme, nextTheme);
        updateControl();
    });
    updateControl();
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

function initialiseAuthNavigation() {
    const user = getCurrentUser();
    const currentPage = document.body.dataset.page;
    document.querySelectorAll("[data-auth-link]").forEach(link => {
        link.textContent = user ? "Profile" : "Log in";
        link.href = user ? "profile.html" : "login.html";
        const isCurrent = user ? currentPage === "profile" : currentPage === "login";
        link.classList.toggle("active", isCurrent);
        if (isCurrent) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    if (text !== undefined) {
        element.textContent = text;
    }
    return element;
}

function createMenuCard(item) {
    const card = createElement("article", "menu-item");
    const top = createElement("div", "menu-item-top");
    top.append(createElement("h3", "", item.name), createElement("p", "menu-price", `${item.price.toLocaleString("en-US")} KZT`));
    const description = createElement("p", "menu-description", item.description);
    const meta = createElement("p", "menu-meta");
    meta.append(createElement("span", "", item.size), createElement("span", "", item.category));
    card.append(top, description, meta);
    return card;
}

function initialiseMenu() {
    const menuGrid = document.getElementById("menu-list");
    if (!menuGrid) {
        return;
    }
    const items = [
        { name: "Espresso", category: "Coffee", size: "60 ml", price: 700, description: "A short, rich shot with a balanced finish." },
        { name: "Americano", category: "Coffee", size: "250 ml", price: 900, description: "Espresso lengthened with hot water." },
        { name: "Cappuccino", category: "Coffee", size: "250 ml", price: 1200, description: "Espresso, steamed milk and a soft layer of foam." },
        { name: "Latte", category: "Coffee", size: "300 ml", price: 1400, description: "A mellow milk coffee with a light foam cap." },
        { name: "Hot chocolate", category: "Other drinks", size: "250 ml", price: 1100, description: "Warm milk and cocoa with gentle sweetness." },
        { name: "Black tea", category: "Other drinks", size: "350 ml", price: 600, description: "A freshly brewed pot served without milk." },
        { name: "Butter croissant", category: "Snacks", size: "1 piece", price: 800, description: "Flaky pastry with a golden, buttery crust." },
        { name: "Chocolate cookie", category: "Snacks", size: "1 cookie", price: 500, description: "A soft-baked cookie with dark chocolate pieces." }
    ];
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
        const visibleItems = items.filter(item => {
            const matchesCategory = category === "all" || item.category === category;
            const searchableText = `${item.name} ${item.description} ${item.size} ${item.category}`.toLowerCase();
            return matchesCategory && searchableText.includes(query);
        });
        menuGrid.replaceChildren(...visibleItems.map(createMenuCard));
        menuGrid.hidden = visibleItems.length === 0;
        empty.hidden = visibleItems.length !== 0;
        count.textContent = `Showing ${visibleItems.length} of ${items.length} items`;
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
        Array.isArray(item.ingredients) && item.ingredients.some(ingredient => typeof ingredient === "string" && ingredient.trim());
}

function createGuideCard(item) {
    const card = createElement("article", "guide-card");
    const ingredients = item.ingredients.filter(ingredient => typeof ingredient === "string" && ingredient.trim()).map(ingredient => ingredient.trim());
    const ingredientText = createElement("p", "ingredients");
    const label = createElement("strong", "", "Ingredients: ");
    ingredientText.append(label, document.createTextNode(ingredients.join(", ")));
    card.append(
        createElement("h3", "", item.title.trim()),
        ingredientText,
        createElement("p", "", item.description.trim())
    );
    return card;
}

function initialiseCoffeeGuide() {
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
    return EMAIL_PATTERN.test(email) ? "" : "Enter a valid email address, for example name@example.com.";
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

function makeField(id, validator) {
    return {
        input: document.getElementById(id),
        error: document.getElementById(`${id}-error`),
        validator
    };
}

function clearFieldError(field) {
    field.error.textContent = "";
    field.input.classList.remove("is-invalid");
    field.input.removeAttribute("aria-invalid");
}

function validateField(field) {
    const message = field.validator(field.input.value);
    field.error.textContent = message;
    field.input.classList.toggle("is-invalid", Boolean(message));
    if (message) {
        field.input.setAttribute("aria-invalid", "true");
    } else {
        field.input.removeAttribute("aria-invalid");
    }
    return !message;
}

function hideFormStatus(status) {
    if (status) {
        status.hidden = true;
        status.textContent = "";
    }
}

function showFormStatus(status, message, type) {
    if (!status) {
        return;
    }
    status.textContent = message;
    status.classList.remove("form-status--success", "form-status--error");
    status.classList.add(`form-status--${type}`);
    status.setAttribute("role", type === "error" ? "alert" : "status");
    status.hidden = false;
}

function setupValidatedForm(formId, fields, onValid) {
    const form = document.getElementById(formId);
    if (!form) {
        return;
    }
    const status = form.querySelector(".form-status");
    fields.forEach(field => {
        field.input.addEventListener("input", () => {
            clearFieldError(field);
            hideFormStatus(status);
        });
    });
    form.addEventListener("submit", event => {
        event.preventDefault();
        hideFormStatus(status);
        let firstInvalid = null;
        fields.forEach(field => {
            if (!validateField(field) && !firstInvalid) {
                firstInvalid = field.input;
            }
        });
        if (firstInvalid) {
            firstInvalid.focus();
            return;
        }
        onValid({ form, status, fields });
    });
}

function initialiseContactForm() {
    if (!document.getElementById("contact-form")) {
        return;
    }
    const fields = [
        makeField("contact-name", validateName),
        makeField("contact-email", validateEmail),
        makeField("contact-phone", validatePhone),
        makeField("contact-message", validateMessage)
    ];
    setupValidatedForm("contact-form", fields, ({ form, status }) => {
        const name = document.getElementById("contact-name").value.trim();
        form.reset();
        fields.forEach(clearFieldError);
        showFormStatus(status, `Thank you, ${name}. Your message has been received.`, "success");
    });
}

function initialiseSignupForm() {
    if (!document.getElementById("signup-form")) {
        return;
    }
    const fields = [
        makeField("signup-name", validateName),
        makeField("signup-email", validateEmail),
        makeField("signup-phone", validatePhone),
        makeField("signup-password", validatePassword),
        makeField("signup-confirm", value => {
            if (!value) {
                return "Confirm your password.";
            }
            return value === document.getElementById("signup-password").value ? "" : "Passwords do not match.";
        })
    ];
    setupValidatedForm("signup-form", fields, ({ status }) => {
        const emailInput = document.getElementById("signup-email");
        const email = emailInput.value.trim().toLowerCase();
        const users = getUsers();
        if (users.some(user => user.email.toLowerCase() === email)) {
            const emailField = fields.find(field => field.input === emailInput);
            emailField.error.textContent = "An account with this email already exists. Try logging in.";
            emailInput.classList.add("is-invalid");
            emailInput.setAttribute("aria-invalid", "true");
            emailInput.focus();
            return;
        }
        const user = {
            name: document.getElementById("signup-name").value.trim(),
            email,
            phone: document.getElementById("signup-phone").value.trim(),
            password: document.getElementById("signup-password").value
        };
        users.push(user);
        if (!writeStorage(STORAGE_KEYS.users, JSON.stringify(users))) {
            showFormStatus(status, "Your account could not be saved in this browser. Check storage settings and try again.", "error");
            return;
        }
        window.location.assign("login.html?registered=1");
    });
}

function initialiseLoginForm() {
    const form = document.getElementById("login-form");
    if (!form) {
        return;
    }
    const registrationMessage = document.getElementById("registration-success");
    if (new URLSearchParams(window.location.search).get("registered") === "1") {
        registrationMessage.hidden = false;
    }
    const fields = [
        makeField("login-email", validateEmail),
        makeField("login-password", validatePassword)
    ];
    setupValidatedForm("login-form", fields, ({ status }) => {
        const email = document.getElementById("login-email").value.trim().toLowerCase();
        const password = document.getElementById("login-password").value;
        const user = getUsers().find(candidate => candidate.email.toLowerCase() === email && candidate.password === password);
        if (!user) {
            showFormStatus(status, "Email or password is incorrect. Please check your details and try again.", "error");
            return;
        }
        if (!writeStorage(STORAGE_KEYS.session, JSON.stringify({ email: user.email }))) {
            showFormStatus(status, "We could not start your session. Check browser storage settings and try again.", "error");
            return;
        }
        window.location.assign("profile.html");
    });
}

function initialiseProfile() {
    const empty = document.getElementById("profile-logged-out");
    if (!empty) {
        return;
    }
    const details = document.getElementById("profile-details");
    const user = getCurrentUser();
    if (user) {
        empty.hidden = true;
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

function initialiseSite() {
    initialiseTheme();
    initialiseAuthNavigation();
    initialiseMenu();
    initialiseCoffeeGuide();
    initialiseContactForm();
    initialiseSignupForm();
    initialiseLoginForm();
    initialiseProfile();
}

applyTheme(getInitialTheme());

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseSite);
} else {
    initialiseSite();
}
