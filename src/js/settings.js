window.onload = function() {
    var button = document.getElementById("button");
    var textarea = document.getElementById("urls");
    var delay = document.getElementById("delay");

    // register button click
    button.onclick = function() {
        var sleep = parseInt(delay.value);
        var slides = textarea.value.split("\n")
            .filter(function(line) {
                    return line;
                })
            .map(function(url) {
                    return { sleep: sleep, url: url, };
                });
        chrome.extension.sendMessage({
            type: "roll-on",
            slides: slides,
        });
        localStorage.setItem('slides', JSON.stringify(slides));
    }

    textarea.value = JSON.parse(localStorage.getItem('slides') || "[]")
        .map(function(slide) { return slide.url; })
        .join("\n");

}
