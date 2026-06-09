const header = document.getElementById("header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 250) {
        header.classList.add("show");
    }
    else {
        header.classList.remove("show");
    }

});