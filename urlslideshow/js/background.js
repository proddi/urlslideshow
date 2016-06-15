var icons = {
        stopped: {
            "19": "icons/slideshow-24.png",
            "38": "icons/slideshow-48.png"
        },
        running: {
            "19": "icons/slideshow-running-24.png",
            "38": "icons/slideshow-running-48.png"
        },
    };

// The slide show
var show = new SlideShow({
        slides: JSON.parse(localStorage.getItem('slides') || "[]"),
        defaultSleep: parseInt(localStorage.getItem('defaultSleep')) || 60,
        autostart: !!localStorage.getItem('autostart'),
        fullscreen: !!localStorage.getItem('fullscreen'),
        onstart: function() {
            chrome.browserAction.setIcon({ "path": icons.running, });
        },
        onstop: function() {
            chrome.browserAction.setIcon({ "path": icons.stopped, });
        },
    });

// Browser-icon click handler
chrome.browserAction.onClicked.addListener(function() {
    show.startStop();
});

// Message listener (options i/o)
chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
    switch(message.type) {
        case "goto":
            if (show) {
                var url = message.url;
                for (var i=0; i<show.slides.length; i++) {
                    if (show.slides[i].url == url) {
                        show.goto(i);
                        break;
                    }
                }
            }
            break;

        case "getSlides":
            sendResponse({
                    slides: show.slides,
                    defaultSleep: show.defaultSleep,
                    autostart: show.autostart,
                    fullscreen: show.fullscreen,
                });
            break;

        case "putSlides":
            show.slides         = message.slides;
            show.defaultSleep   = message.defaultSleep || 60;
            show.autostart      = message.autostart;
            show.fullscreen     = message.fullscreen;
            localStorage.setItem('slides', JSON.stringify(show.slides));
            localStorage.setItem('defaultSleep', show.defaultSleep);
            localStorage.setItem('autostart', show.autostart || "");
            localStorage.setItem('fullscreen', show.fullscreen || "");
            break;

        break;
    }
});


show.autostart && show.startStop();
