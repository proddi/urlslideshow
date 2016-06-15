/**
 * The Slide show
 */
function SlideShow(options) {
    this.slides         = options.slides || [];
    this.defaultSleep   = options.defaultSleep || 60;
    this.autostart      = options.autostart;
    this.fullscreen     = options.fullscreen;
    this.onstart        = options.onstart;
    this.onstop         = options.onstop;
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
    this._tabPromise && this._tabPromise.then(function(tab) {
        chrome.tabs.remove(tab.id, function() {
                var e = chrome.runtime.lastError;  // To avoid: Unchecked runtime.lastError while running <func>
            });
    });
    this._tabPromise = undefined;
    this.onstop && this.onstop(this);
};

SlideShow.prototype.nextSlidePlease = function nextSlidePlease(rotate) {
    var that = this;
    var slide = this.slides[++self.index] || this.slides[self.index=0];

    // promise to open a tab on demand
    this._tabPromise = this._tabPromise || new Promise(function(resolve, reject) {
        chrome.tabs.create({ active: true, }, function(tab) {
            if (that.fullscreen) {
                chrome.windows.update(tab.windowId, { state: "fullscreen", });
            }
            resolve(tab);
        });
    });

    // change url
    this._tabPromise.then(function(tab) {
        console.log('Showing slide', slide);
        chrome.tabs.update(tab.id, {url: slide.url}, function(tab) {
            if (chrome.runtime.lastError) {
                console.error("Tab update failed: " + chrome.runtime.lastError.message);
                that.stop();
            }
        });
    });

    // if rotate schedule next slide
    rotate && this._tabPromise.then(function() {
        var sleep = slide.sleep || that.defaultSleep;
        that._scheduledHandle = setTimeout(that.nextSlidePlease.bind(that, rotate), sleep * 1000);
    }, function fail() {
        that.stop();
    });
};

SlideShow.prototype.goto = function goto(index) {
    if (this.running) {
        this._scheduledHandle = this._scheduledHandle && clearTimeout(this._scheduledHandle) && undefined;
        self.index = index-1;
        this.nextSlidePlease(true);
    }
};
