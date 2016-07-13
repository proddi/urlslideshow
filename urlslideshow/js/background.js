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
    onstart: function() {
        chrome.browserAction.setIcon({ "path": icons.running, });
        chrome.contextMenus.update(startStopMenuItem, { title: "Stop slideshow", });
    },
    onstop: function() {
        chrome.browserAction.setIcon({ "path": icons.stopped, });
        chrome.contextMenus.update(startStopMenuItem, { title: "Start slideshow", });
    },
    onSlideAdded: function(slide) {
        console.log("new slide", slide);
    },
    onSlideRemoved: function(slide) {
        console.log("slide removed", slide);
    },
});

// IO functions
function loadShow(show) {
    show.setSlides(JSON.parse(localStorage.getItem('slides') || "[]"));
    show.defaultSleep   = parseInt(localStorage.getItem('defaultSleep')) || 60;
    show.autostart      = !!localStorage.getItem('autostart');
    show.fullscreen     = !!localStorage.getItem('fullscreen');
};

function saveShow(show) {
    console.info("saveShow()", show);
    localStorage.setItem('slides', JSON.stringify(show.getSlides()));
    localStorage.setItem('defaultSleep', show.defaultSleep);
    localStorage.setItem('autostart', show.autostart || "");
    localStorage.setItem('fullscreen', show.fullscreen || "");
};

// Browser-icon click handler
chrome.browserAction.onClicked.addListener(function() {
    show.startStop();
});

// Context menu for start/stop/pause show
var startStopMenuItem = chrome.contextMenus.create({
    type: "normal",
    title: "Start Slideshow",
    contexts: ["browser_action"],
    onclick: function(data) {
        show.startStop();
    },
});

// Context menu user interface
var addUrlMenuItem = chrome.contextMenus.create({
    type: "normal",
    title: "Add this page",
    contexts: ["browser_action"],
    onclick: function(data) {
        chrome.tabs.getSelected(null, function(tab) {
            if (tab && tab.url) {
                show.addSlide({ url: tab.url, });
                saveShow(show);
                updateActiveUrl(tab.url);
            }
        });
    },
});

// ContextMenus
var removeUrlMenuItem = chrome.contextMenus.create({
    type: "normal",
    title: "Remove this page",
    contexts: ["browser_action"],
    onclick: function(data) {
        chrome.tabs.getSelected(null, function(tab) {
            if (tab && tab.url) {
                show.removeSlideByUrl(tab.url);
                saveShow(show);
                updateActiveUrl(tab.url);
            }
        });
    },
});

// Slides Overview
chrome.contextMenus.create({
    type: "normal",
    title: "Goto Slides",
    id: "slidesId",
    contexts: ["browser_action"],
});

show.onSlideAdded = function onSlideAdded(slide) {
    return chrome.contextMenus.create({
        type: "normal",
        title: slide.url,
        parentId: "slidesId",
        contexts: ["browser_action"],
        onclick: function(data) {
            show.gotoSlideByUrl(slide.url);
        },
    });
};

show.onSlideRemoved = function onSlideRemoved(slide, data) {
    chrome.contextMenus.remove(data);
}

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
                    slides: show.getSlides(),
                    defaultSleep: show.defaultSleep,
                    autostart: show.autostart,
                    fullscreen: show.fullscreen,
                });
            break;

        case "putSlides":
            show.setSlides(message.slides);
            show.defaultSleep   = message.defaultSleep || 60;
            show.autostart      = message.autostart;
            show.fullscreen     = message.fullscreen;
            saveShow(show);
            break;
/*
        case "requestCmd":
            switch(message.cmd) {
                case "pause":
                    console.log("pause show...");
                    break;

                case "resume":
                    console.log("resume show...");
                    break;

                break;
            }
*/
        break;
    }
});


// Context menu for adding/removing current tab url
var activeTabId, activeUrl;
function updateActiveUrl(url) {
    activeUrl = url;
    var inRotation = show.findSlideByUrl(activeUrl);
    chrome.contextMenus.update(addUrlMenuItem, { enabled: !inRotation, });
    chrome.contextMenus.update(removeUrlMenuItem, { enabled: !!inRotation, });
};

chrome.tabs.onActivated.addListener(function(activeInfo) {
    activeTabId = activeInfo.tabId;
    activeUrl = null;
    chrome.tabs.get(activeTabId, function(tab) {
        if (activeUrl == null) {
            updateActiveUrl(tab.url);
        }
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (tabId == activeTabId) {
        updateActiveUrl(tab.url);
    }
});


loadShow(show);

show.autostart && show.startStop();
