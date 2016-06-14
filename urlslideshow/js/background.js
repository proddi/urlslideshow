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
        onstart: function() {
            chrome.browserAction.setIcon({ "path": icons.running, });
        },
        onstop: function() {
            chrome.browserAction.setIcon({ "path": icons.stopped, });
        },
    });

// Browser-icon click handler
chrome.browserAction.onClicked.addListener(function() {
    show.startStop(show);
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
            sendResponse({ slides: show.slides, defaultSleep: show.defaultSleep, });
            break;

        case "putSlides":
            show.slides         = message.slides;
            show.defaultSleep   = message.defaultSleep || 60;
            localStorage.setItem('slides', JSON.stringify(show.slides));
            localStorage.setItem('defaultSleep', show.defaultSleep);
            break;

        break;
    }
});

// The slide show
function SlideShow(options) {
    this.slides = options.slides || [];
    this.defaultSleep = options.defaultSleep || 60;
    this.onstart = options.onstart;
    this.onstop = options.onstop;
};

SlideShow.prototype.startStop = function startStop() {  // pause/unpause as well
    if (!this.running) this.start();
    else this.stop();
};

SlideShow.prototype.start = function start() {
    if (this.running) return;
    console.warn(this, "start()");
    this.running = true;
    this.nextSlidePlease(true);
    this.onstart && this.onstart(this);
};

SlideShow.prototype.stop = function stop() {
    this._scheduledHandle = this._scheduledHandle && clearTimeout(this._scheduledHandle) && undefined;
    if (!this.running) return;
    this.running = false;
    console.warn(this, "stop()");
    this._tabPromise = this._tabPromise && this._tabPromise.then(function(tab) { chrome.tabs.remove(tab.id); }) && undefined;
    this.onstop && this.onstop(this);
};

SlideShow.prototype.nextSlidePlease = function nextSlidePlease(rotate) {
    var that = this;
    var slide = this.slides[++self.index] || this.slides[self.index=0];

    // promise to open a tab on demand
    this._tabPromise = this._tabPromise || new Promise(function(resolve, reject) {
        chrome.tabs.create({ active: true, }, resolve);
    });

    // change url
    this._tabPromise.then(function(tab) {
        return new Promise(function(resolve, reject) {
            console.log('Showing slide', slide);
            chrome.tabs.update(tab.id, {url: slide.url}, function(tab) {
                if (tab) resolve(tab);
                else reject();
            });
        });
    });

    // if rotate schedule next slide
    rotate && this._tabPromise.then(function() {
        var sleep = slide.sleep || that.defaultSleep;
        that._scheduledHandle = setTimeout(that.nextSlidePlease.bind(that, rotate), sleep * 1000);
    });

    // stop on error
    this._tabPromise.catch(this.stop.bind(this));
};

SlideShow.prototype.goto = function goto(index) {
    if (this.running) {
        this._scheduledHandle = this._scheduledHandle && clearTimeout(this._scheduledHandle) && undefined;
        self.index = index-1;
        this.nextSlidePlease(true);
    }
};
