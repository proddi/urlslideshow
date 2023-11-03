/**
 * The Slide show
 */
export function SlideShow(options) {
    var noFunc = function () {
    };
    this.slides = options.slides || [];
    this.defaultSleep = options.defaultSleep || 60;
    this.autostart = options.autostart;
    this.fullscreen = options.fullscreen;
    this.onstart = options.onstart;
    this.onstop = options.onstop;
    this.onSlideAdded = options.onSlideAdded || noFunc;
    this.onSlideRemoved = options.onSlideRemoved || noFunc;
};


SlideShow.prototype.setSlides = function setSlides(slides) {
    var that = this;
    this.slides.forEach(function (slide) {
        that.onSlideRemoved(slide, slide._meta);
    });
    this.slides = slides;
    this.slides.forEach(function (slide) {
        slide._meta = that.onSlideAdded(slide);
    });
};

SlideShow.prototype.getSlides = function getSlides() {
    return this.slides.map(function (slide) {
        return {url: slide.url, sleep: slide.sleep,};
    });
};

SlideShow.prototype.addSlide = function addSlide(slide) {
    this.slides.push(slide);
    slide._meta = this.onSlideAdded(slide);
};

SlideShow.prototype.findSlideByUrl = function findSlideByUrl(url) {
    return this.slides.find(function (slide) {
        return slide.url == url;
    });
};

SlideShow.prototype.removeSlideByUrl = function removeSlideByUrl(url) {
    var slide = this.findSlideByUrl(url),
        i = this.slides.indexOf(slide);
    if (i >= 0) {
        this.slides.splice(i, 1);
        this.onSlideRemoved(slide, slide._meta);
    }
    return slide;
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
    console.log("Stopping...");
    this._tabPromise && this._tabPromise.then(function (tab) {
        chrome.tabs.remove(tab.id, function () {
            var e = chrome.runtime.lastError;  // To avoid: Unchecked runtime.lastError while running <func>
        });
    });
    this._tabPromise = undefined;
    this.onstop && this.onstop(this);
};

function registerFailures(result) {
    // result[0].result && chrome.notifications.create(Date.now()+"", {
    //     title: 'Hey, theres a new Jenkins failure!',
    //     message: result[0].result[0],
    //     type: 'basic',
    //     iconUrl: chrome.runtime.getURL('icons/slideshow-running-24.png')
    // });
}

SlideShow.prototype.nextSlidePlease = function nextSlidePlease(rotate) {
    var that = this;
    var slide = this.slides[++self.index] || this.slides[self.index = 0];

    // promise to open a tab on demand
    this._tabPromise = this._tabPromise || new Promise(function (resolve, reject) {
        chrome.tabs.create({active: true,}, function (tab) {
            if (that.fullscreen) {
                chrome.windows.update(tab.windowId, {state: "fullscreen",});
            }
            resolve(tab);
        });
    });

    // change url
    this._tabPromise.then(function (tab) {
        console.log('Showing slide', slide);
        chrome.tabs.update(tab.id, {url: slide.url}, function (tab) {
            if (chrome.runtime.lastError) {
                console.error("Tab update failed: " + chrome.runtime.lastError.message);
                that.stop();
            } else {
                chrome.scripting.executeScript({
                        target: {
                            tabId: tab.id
                        },
                        files: ["js/getFailures.js"]
                    }
                ).then(registerFailures);
            }
        });
    });

    // if rotate schedule next slide
    rotate && this._tabPromise.then(function () {
        var sleep = slide.sleep || that.defaultSleep;
        that._scheduledHandle = setTimeout(that.nextSlidePlease.bind(that, rotate), sleep * 1000);
    }, function fail() {
        that.stop();
    });
};

SlideShow.prototype.goto = function goto(index) {
    if (this.running) {
        this._scheduledHandle = this._scheduledHandle && clearTimeout(this._scheduledHandle) && undefined;
        self.index = index - 1;
        this.nextSlidePlease(true);
    }
};

SlideShow.prototype.gotoSlideByUrl = function gotoSlideByUrl(url) {
    var slide = this.findSlideByUrl(url);
    this.goto(this.slides.indexOf(slide));
};