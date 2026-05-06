const isLightMode = localStorage.getItem("theme") === "light";

if (isLightMode) {
    document.documentElement.classList.add("light-mode");
}

document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("themeToggle");

    if (toggleBtn) {
        toggleBtn.innerText = isLightMode ? "🌙" : "☀️";

        toggleBtn.addEventListener("click", () => {
            const isNowLight = document.documentElement.classList.toggle("light-mode");
            localStorage.setItem("theme", isNowLight ? "light" : "dark");
            toggleBtn.innerText = isNowLight ? "🌙" : "☀️";
        });
    }
});