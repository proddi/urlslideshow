window.onload = function() {
    chrome.storage.local.get('slides', function (result) {
        //var slides = result.slides;
        var URLTemplate = new Template(document.querySelector("[template=url]"));

        var nodes = [];
        var isPlaying;

        // get the settings
        chrome.runtime.sendMessage({
            type: "getSlides",
        }, function(settings) {
            console.log("got", settings);
            document.getElementById("defaultTime").value = settings.defaultSleep;
            document.getElementById("autostart").checked = settings.autostart,
                document.getElementById("fullscreen").checked = settings.fullscreen,
                settings.slides.forEach(function(slide) {
                    var clone = URLTemplate.clone(slide).append();
                    clone.find("input[type=button]").onclick = function() {  // TODO: generic click handlers?
                        chrome.runtime.sendMessage({
                            type: "goto",
                            url: clone.find("input[type=text]").value,
                        });
                    };
                    nodes.push(clone);
                });
        });

        // adds a url line
        document.getElementById("add").onclick = function() {
            var clone = URLTemplate.clone({ url: "", sleep: "", }).append();
            clone.find("input[type=button]").onclick = function() {  // TODO: generic click handlers?
                chrome.runtime.sendMessage({
                    type: "goto",
                    url: clone.find("input[type=text]").value,
                });
            };
            nodes.push(clone);
        };

        // save button
        document.getElementById("save").onclick = function() {
            chrome.runtime.sendMessage({
                type: "putSlides",
                slides: buildSlides(nodes),
                defaultSleep: parseInt(document.getElementById("defaultTime").value),
                autostart: document.getElementById("autostart").checked,
                fullscreen: document.getElementById("fullscreen").checked,
            }, function() {
                window.close();
            });
        };

    });

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
