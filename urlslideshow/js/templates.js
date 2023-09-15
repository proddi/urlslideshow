/*
 * A micro template engine in vanilla javascript
 * example: https://jsfiddle.net/at2h6ob0/
 */

var Template = function(node) {
    this.node = node;
    this.parent = node.parentNode;
    this.parent.removeChild(node);
    this.html = node.innerHTML;
};

Template.prototype.clone = function clone(scope) {
        return new TemplateClone(this, scope || {});
};

var TemplateClone = function(template, scope) {
        this.template = template;
        this.scope = scope;
    this.node = template.node.cloneNode(false);
    this.update();
};

TemplateClone.prototype.update = function update(scope) {
        scope = scope || this.scope;
        console.log("scope is " + scope)
        this.node.innerHTML = this.template.html.replace(/\{\s*(\w+)\s*\}/g, function(all, key) {
        var value = scope[key];
        return (value === undefined) ? "{" + key + "}" : value;
    });
};

TemplateClone.prototype.append = function append() {
    this.template.parent.appendChild(this.node);
    return this;
};

TemplateClone.prototype.find = function find(selector) {
    return this.node.querySelector(selector);
};
