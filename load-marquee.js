document.addEventListener("DOMContentLoaded", function () {
    const placeholder = document.getElementById("marquee-placeholder");
    if (!placeholder) return;

    fetch("marquee.html")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            placeholder.innerHTML = data;
        })
        .catch(error => {
            console.error("跑馬燈載入失敗:", error);
        });
});
