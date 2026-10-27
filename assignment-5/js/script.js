"use strict";

const chime = new Audio("sounds/notify.wav");

function playChime() {
    chime.currentTime = 0;
    chime.play().catch(function () {});
}

document.addEventListener("DOMContentLoaded", function () {
    initAccordion();
    initPopup();
    initContactForm();
    initThemeSwitch();
    initDateTime();
    initMenu();
    initRating();
    initNavKeys();
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmail(value) {
    return EMAIL_PATTERN.test(value.trim());
}

function notEmpty(value) {
    return value.trim() !== "";
}

function setError(input, message) {
    const error = document.getElementById(input.id + "-error");
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    if (error) {
        error.textContent = message;
    }
}

function clearError(input) {
    const error = document.getElementById(input.id + "-error");
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    if (error) {
        error.textContent = "";
    }
}

function validateField(input, rule, message) {
    if (rule(input.value)) {
        clearError(input);
        return true;
    }
    setError(input, message);
    return false;
}

function initAccordion() {
    const questions = document.querySelectorAll(".accordion-toggle");

    questions.forEach(function (question) {
        question.addEventListener("click", function () {
            const item = question.closest(".accordion-item");
            const answer = document.getElementById(question.getAttribute("aria-controls"));
            const isOpen = item.classList.contains("open");

            if (isOpen) {
                item.classList.remove("open");
                question.setAttribute("aria-expanded", "false");
                answer.style.maxHeight = null;
            } else {
                item.classList.add("open");
                question.setAttribute("aria-expanded", "true");
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });
}

function initPopup() {
    const popup = document.getElementById("subscribe-popup");
    const openButton = document.getElementById("subscribe-open");
    if (!popup || !openButton) {
        return;
    }

    const closeButton = popup.querySelector(".popup-close");
    const form = document.getElementById("subscribe-form");
    const success = document.getElementById("subscribe-success");
    const email = document.getElementById("sub-email");
    const password = document.getElementById("sub-password");
    const confirm = document.getElementById("sub-confirm");

    function resetPopup() {
        form.hidden = false;
        success.hidden = true;
        form.reset();
        [email, password, confirm].forEach(clearError);
    }

    function openPopup() {
        resetPopup();
        popup.classList.add("visible");
        popup.setAttribute("aria-hidden", "false");
        email.focus();
    }

    function closePopup() {
        popup.classList.remove("visible");
        popup.setAttribute("aria-hidden", "true");
        openButton.focus();
    }

    openButton.addEventListener("click", openPopup);
    closeButton.addEventListener("click", closePopup);

    popup.addEventListener("click", function (event) {
        if (event.target === popup) {
            closePopup();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && popup.classList.contains("visible")) {
            closePopup();
        }
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        let valid = true;
        if (!validateField(email, isEmail, "Please enter a valid email address, like name@mail.com.")) {
            valid = false;
        }
        if (!validateField(password, function (value) { return value.length >= 8; },
                "The password must be at least 8 characters long.")) {
            valid = false;
        }
        if (!validateField(confirm, function (value) { return value === password.value; },
                "The passwords do not match.")) {
            valid = false;
        }

        if (valid) {
            success.querySelector("p").textContent =
                "Thank you for subscribing! Menu news will be sent to " + email.value.trim() + ".";
            form.hidden = true;
            success.hidden = false;
            playChime();
        }
    });

    [email, password, confirm].forEach(function (field) {
        field.addEventListener("input", function () {
            clearError(field);
        });
    });
}

function initContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) {
        return;
    }

    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const message = document.getElementById("message");
    const success = document.getElementById("contact-success");
    const error = document.getElementById("contact-error");

    function showMessage(sent) {
        if (sent) {
            success.textContent = "Thank you, " + name.value.trim() +
                "! Your message has been sent. We will reply to " + email.value.trim() + ".";
            success.hidden = false;
            error.hidden = true;
            form.reset();
            playChime();
        } else {
            error.hidden = false;
            success.hidden = true;
        }
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        success.hidden = true;
        error.hidden = true;

        let valid = true;
        if (!validateField(name, notEmpty, "Please enter your name.")) {
            valid = false;
        }
        if (!validateField(email, isEmail, "Please enter a valid email address, like name@mail.com.")) {
            valid = false;
        }
        if (!validateField(message, notEmpty, "Please write your message.")) {
            valid = false;
        }

        if (valid) {
            const data = new FormData(form);
            sendForm("https://jsonplaceholder.typicode.com/posts", data, showMessage);
        }
    });

    [name, email, message].forEach(function (field) {
        field.addEventListener("input", function () {
            clearError(field);
        });
    });
}

function sendForm(url, data, callback) {
    fetch(url, { method: "POST", body: data })
        .then(function (response) {
            callback(response.ok);
        })
        .catch(function () {
            callback(false);
        });
}

function initThemeSwitch() {
    const button = document.getElementById("theme-btn");
    if (!button) {
        return;
    }

    button.addEventListener("click", function () {
        const night = document.body.classList.toggle("night");
        button.textContent = night ? "Day mode" : "Night mode";
        button.setAttribute("aria-pressed", String(night));
    });
}

function initDateTime() {
    const clock = document.getElementById("site-datetime");
    if (!clock) {
        return;
    }

    const months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    function updateClock() {
        const now = new Date();

        let hours = now.getHours();
        const part = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) {
            hours = 12;
        }

        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");

        clock.textContent = months[now.getMonth()] + " " + now.getDate() + ", " +
            now.getFullYear() + ", " + hours + ":" + minutes + ":" + seconds + " " + part;
    }

    updateClock();
    setInterval(updateClock, 1000);
}

const menu = {
    items: [
        { name: "Espresso", category: "coffee", size: "30 ml", price: 700 },
        { name: "Americano", category: "coffee", size: "250 ml", price: 900 },
        { name: "Cappuccino", category: "coffee", size: "250 ml", price: 1200 },
        { name: "Latte", category: "coffee", size: "300 ml", price: 1300 },
        { name: "Hot chocolate", category: "drinks", size: "250 ml", price: 1100 },
        { name: "Green tea", category: "drinks", size: "400 ml", price: 600 },
        { name: "Croissant", category: "snacks", size: "80 g", price: 800 },
        { name: "Cinnamon roll", category: "snacks", size: "110 g", price: 950 }
    ],
    body: null,
    count: null,
    filter: function (category) {
        switch (category) {
            case "coffee":
                return this.items.filter(function (item) { return item.category === "coffee"; });
            case "drinks":
                return this.items.filter(function (item) { return item.category === "drinks"; });
            case "snacks":
                return this.items.filter(function (item) { return item.category === "snacks"; });
            default:
                return this.items;
        }
    },
    render: function (category) {
        const shown = this.filter(category);
        const rows = [];

        for (let i = 0; i < shown.length; i++) {
            rows.push("<tr><td>" + shown[i].name + "</td><td>" + shown[i].size +
                "</td><td>" + shown[i].price.toLocaleString("en-US") + " KZT</td></tr>");
        }

        this.body.innerHTML = rows.join("");
        this.count.textContent = "Showing " + shown.length + " of " + this.items.length + " items";

        const tableRows = this.body.querySelectorAll("tr");
        tableRows.forEach(function (row, index) {
            row.style.animationDelay = (index * 0.06) + "s";
        });
    }
};

function initMenu() {
    const body = document.getElementById("menu-body");
    const buttons = document.querySelectorAll(".filter-btn");
    if (!body || buttons.length === 0) {
        return;
    }

    menu.body = body;
    menu.count = document.getElementById("menu-count");

    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            buttons.forEach(function (other) {
                other.classList.remove("btn-primary");
                other.classList.add("btn-outline-primary");
            });
            button.classList.remove("btn-outline-primary");
            button.classList.add("btn-primary");
            menu.render(button.dataset.filter);
        });
    });

    menu.render("all");
}

function initRating() {
    const rating = document.getElementById("rating");
    const message = document.getElementById("rating-message");
    if (!rating || !message) {
        return;
    }

    const stars = rating.querySelectorAll(".star");

    stars.forEach(function (star) {
        star.addEventListener("click", function () {
            const value = Number(star.dataset.value);

            stars.forEach(function (other) {
                const selected = Number(other.dataset.value) <= value;
                other.classList.toggle("selected", selected);
                other.setAttribute("aria-pressed", String(selected));
            });

            message.textContent = "Thanks! You rated us " + value + " out of " + stars.length + ".";
            playChime();
        });
    });
}

function initNavKeys() {
    const links = Array.from(document.querySelectorAll("#mainNav .nav-link"));
    if (links.length === 0) {
        return;
    }

    function moveFocus(event, step) {
        const current = links.indexOf(document.activeElement);
        if (current === -1) {
            return;
        }
        event.preventDefault();
        const next = (current + step + links.length) % links.length;
        links[next].focus();
    }

    document.addEventListener("keydown", function (event) {
        if (event.target.closest("input, textarea, select")) {
            return;
        }

        switch (event.key) {
            case "ArrowRight":
            case "ArrowDown":
                moveFocus(event, 1);
                break;
            case "ArrowLeft":
            case "ArrowUp":
                moveFocus(event, -1);
                break;
        }
    });
}
