(function (window, document) {
    const demo = document.querySelector("#demo");
    const menu = document.querySelector("#menu");
    const nav = document.querySelector(".nav");

    function onClick(event) {
        event.preventDefault();
        demo.src = this.href;
        [].forEach.call(this.parentNode.parentNode.childNodes, function(el) {
            if (el.nodeName === "LI") {
                el.classList.remove("active");
            }
        });
        this.parentNode.classList.add("active");
    }

    function loadMenu() {
        const path = menu.dataset.path || "../";
        fetch(path + "./menu.json").then(function(response) {
            return response.json();
        }).then(function(data) {
            renderMenu(data);
        });
    }

    function renderMenu(data) {
        let a;
        let li;
        let ul;
        let heading;
        let aside;
        let regex;
        const path = menu.dataset.path || "../";

        aside = document.createElement("aside");
        ul = document.createElement("ul");
        li = document.createElement("li");
        if (path === "./") {
            li.className = "active";
        }
        a = document.createElement("a");
        a.href = path;
        a.innerHTML = "&laquo; Back to Home";
        li.appendChild(a);
        ul.appendChild(li);
        aside.appendChild(ul);
        menu.appendChild(aside);

        for (const [key, value] of Object.entries(data)) {
            aside = document.createElement("aside");
            heading = document.createElement("h3");
            heading.textContent = key.substr(0, 1).toUpperCase() + key.substr(1);
            ul = document.createElement("ul");
            [].forEach.call(value, function (item) {
                li = document.createElement("li");
                regex = new RegExp(item.uri);
                if (regex.test(window.location.pathname)) {
                    li.className = "active";
                }
                a = document.createElement("a");
                a.href = path + item.uri;
                a.textContent = item.text;

                li.appendChild(a);
                ul.appendChild(li);
            });
            aside.appendChild(heading);
            aside.appendChild(ul);
            menu.appendChild(aside);
        }
    }

    window.addEventListener("DOMContentLoaded", function() {
        if (menu) {
            loadMenu();
        }

        if (nav) {
            [].forEach.call(nav.querySelectorAll("a"), function(a) {
                a.addEventListener("click", onClick, false);
            });
        }
    });

})(window, document);