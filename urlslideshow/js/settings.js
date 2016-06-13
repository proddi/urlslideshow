window.onload = function() {
//    var button = document.getElementById("button");
//    var textarea = document.getElementById("urls");
//    var delay = document.getElementById("delay");
    var slides = JSON.parse(localStorage.getItem('slides') || "[]");
    var URLTemplate = new Template(document.querySelector("[template=url]"));
/*
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
*/

    var nodes = [];
    var isPlaying;

    // get the settings
    chrome.extension.sendMessage({
        type: "getSlides",
    }, function(slides) {
        console.log("got slides:", slides);
        slides.forEach(function(slide) {
            var clone = URLTemplate.clone(slide).append();
            clone.find("input[type=button]").onclick = function() {  // TODO: generic click handlers?
                chrome.extension.sendMessage({
                    type: "goto",
                    url: clone.find("input[type=text]").value,
                });
            };
            nodes.push(clone);
        });
    });

    // sets the correct state on the play/stop button
    chrome.extension.sendMessage({
        type: "isPlaying",
    }, function(status) {
        isPlaying = status;
        document.getElementById("play").value = isPlaying ? "Stop Slideshow" : "Start Slideshow";
    });

    // start/stop slideshow
    document.getElementById("play").onclick = function() {
        var slides = buildSlides(nodes);
        chrome.extension.sendMessage({
            type: isPlaying ? "stop" : "play",
            slides: slides,
        });
    };

    // adds a url line
    document.getElementById("add").onclick = function() {
        var clone = URLTemplate.clone({ url: "", sleep: 60, }).append();
        clone.find("input[type=button]").onclick = function() {  // TODO: generic click handlers?
            chrome.extension.sendMessage({
                type: "goto",
                url: clone.find("input[type=text]").value,
            });
        };
        nodes.push(clone);
    };

    // save button
    document.getElementById("save").onclick = function() {
        chrome.extension.sendMessage({
            type: "putSlides",
            slides: buildSlides(nodes),
        });
    };

    // build slides-array out of input elements
    function buildSlides(nodes) {
        return nodes.map(function(node) {
                return {
                    url: node.node.querySelector('input[type=text]').value,
                    sleep: parseInt(node.node.querySelector('input[type=number]').value),
                };
            }).filter(function(slide) {
                return !!slide.url;
            });
    };

}
