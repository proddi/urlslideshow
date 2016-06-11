var canceler;

chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
    console.info("got background message", message);
    switch(message.type) {
        case "roll-on":
            if (canceler) {
                canceler();
                canceler = null;
            } else {
                canceler = startSlideShow(message.slides || []);
            }
            break;
        break;
    }
});

function startSlideShow(slides) {
    console.log("starting slides", slides);
    var nextHandle;
    var showTab;
    chrome.tabs.create({ active: true, }, function(tab) {
        showTab = tab;
        console.log("new tab created:", showTab);

        var current = -1;
        function nextSlidePlease() {
            console.log("slide", current, slides[current]);
            var slide = slides[++current] || slides[current=0];
            chrome.tabs.update(showTab.id, {url: slide.url});
            var delay = (slide.sleep || 5);
            nextHandle = setTimeout(nextSlidePlease, 1000*delay);
            console.log("Slide changed to", slide, "next slide in " + delay + "secs");
        };

        nextSlidePlease();
    });


    return function canceler() {  // cancel the show
        console.log("canceling show...");
        nextHandle && clearTimeout(nextHandle);
        showTab && chrome.tabs.remove(showTab.id);
    };
};
