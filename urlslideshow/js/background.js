var show;
var slideIndex;
var slides = JSON.parse(localStorage.getItem('slides') || "[]");

chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
    switch(message.type) {
        case "play":
            localStorage.setItem('slides', JSON.stringify(message.slides));
            show && show.stop(); // stop previous show
            show = startSlideShow();
            show.start();
            break;

        case "stop":
            show && show.stop();
            show = undefined;
            break;

        case "goto":
            if (show) {
                var url = message.url;
                for (var i=0; i<slides.length; i++) {
                    if (slides[i].url == url) {
                        show.goto(i);
                        break;
                    }
                }
            }
            break;

        case "isPlaying":
            sendResponse(show && show.running);
            break;

        case "getSlides":
            sendResponse(slides);
            break;

        case "putSlides":
            slides = message.slides;
            localStorage.setItem('slides', JSON.stringify(slides));
            break;

        break;
    }
});


function startSlideShow() {
    var nextHandle;
    var showTab;

    function nextSlidePlease() {
        self.running = true;
        var slide = slides[++self.index] || slides[self.index=0];
        showTab && chrome.tabs.update(showTab.id, {url: slide.url}, function(tab) {
            showTab = tab;
            if (!tab) { // tab got closed --> canceling...
                self.stop();
            }
        });
        var delay = (slide.sleep || 60);
        nextHandle = setTimeout(nextSlidePlease, 1000*delay);
        console.log("Show slide", slide, "for " + delay + "seconds...");
    };

    var self = {
        start: function() {
            chrome.tabs.create({ active: true, }, function(tab) {
                showTab = tab;
                console.log("Slideshow tab created...");

                nextSlidePlease();
            });
        },
        stop: function() {
            console.log("Canceling Slideshow...");
            nextHandle && clearTimeout(nextHandle);
            self.running = false;
            showTab && chrome.tabs.remove(showTab.id);
        },
        goto: function(index) {
            if (self.running) {
                nextHandle && clearTimeout(nextHandle);
                self.index = index-1;
                nextSlidePlease();
            }
        },
        index: -1,
        running: false,
    };

    return self;
};
