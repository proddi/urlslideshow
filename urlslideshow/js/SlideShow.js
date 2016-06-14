/**
 * The Slide show
 */
function SlideShow(options) {
    this.slides = options.slides || [];
    this.defaultSleep = options.defaultSleep || 60;
    this.autostart = options.autostart;
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
