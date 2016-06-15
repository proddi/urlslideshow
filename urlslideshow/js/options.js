window.onload = function() {
    var slides = JSON.parse(localStorage.getItem('slides') || "[]");
    var URLTemplate = new Template(document.querySelector("[template=url]"));

    var nodes = [];
    var isPlaying;

    // get the settings
    chrome.extension.sendMessage({
        type: "getSlides",
    }, function(settings) {
        console.log("got", settings);
        document.getElementById("defaultTime").value = settings.defaultSleep;
        document.getElementById("autostart").checked = settings.autostart,
        document.getElementById("fullscreen").checked = settings.fullscreen,
        settings.slides.forEach(function(slide) {
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
            defaultSleep: parseInt(document.getElementById("defaultTime").value),
            autostart: document.getElementById("autostart").checked,
            fullscreen: document.getElementById("fullscreen").checked,
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
