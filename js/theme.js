if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark-mode");
}

document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("themeToggle");

    // ajustar ícone inicial
    if (localStorage.getItem("theme") === "dark") {
        toggleBtn.innerText = "☀️";
    }

    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            document.documentElement.classList.toggle("dark-mode");

            const isDark = document.documentElement.classList.contains("dark-mode");

            localStorage.setItem("theme", isDark ? "dark" : "light");
            toggleBtn.innerText = isDark ? "☀️" : "🌙";
        });
    }
});