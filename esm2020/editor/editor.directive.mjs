import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { Directive, ElementRef, EventEmitter, forwardRef, Input, NgZone, Output } from '@angular/core';
import FroalaEditor from 'froala-editor';
import * as i0 from "@angular/core";
export class FroalaEditorDirective {
    constructor(el, zone) {
        this.zone = zone;
        // editor options
        this._opts = {
            immediateAngularModelUpdate: false,
            angularIgnoreAttrs: null
        };
        this.SPECIAL_TAGS = ['img', 'button', 'input', 'a'];
        this.INNER_HTML_ATTR = 'innerHTML';
        this._hasSpecialTag = false;
        this._editorInitialized = false;
        this._oldModel = null;
        // Begin ControlValueAccesor methods.
        this.onChange = (_) => {
        };
        this.onTouched = () => {
        };
        // froalaModel directive as output: update model if editor contentChanged
        this.froalaModelChange = new EventEmitter();
        // froalaInit directive as output: send manual editor initialization
        this.froalaInit = new EventEmitter();
        this.initialized = false;
        let element = el.nativeElement;
        // check if the element is a special tag
        if (this.SPECIAL_TAGS.indexOf(element.tagName.toLowerCase()) != -1) {
            this._hasSpecialTag = true;
        }
        this._element = element;
        this.zone = zone;
    }
    // Form model content changed.
    writeValue(content) {
        this.updateEditor(content);
        if (content) {
            this.setup();
        }
    }
    registerOnChange(fn) {
        this.onChange = fn;
    }
    registerOnTouched(fn) {
        this.onTouched = fn;
    }
    // End ControlValueAccesor methods.
    // froalaEditor directive as input: store the editor options
    set froalaEditor(opts) {
        this._opts = this.clone(opts || this._opts);
        this._opts = { ...this._opts };
    }
    // TODO: replace clone method with better possible alternate 
    clone(item) {
        const me = this;
        if (!item) {
            return item;
        } // null, undefined values check
        let types = [Number, String, Boolean], result;
        // normalizing primitives if someone did new String('aaa'), or new Number('444');
        types.forEach(function (type) {
            if (item instanceof type) {
                result = type(item);
            }
        });
        if (typeof result == "undefined") {
            if (Object.prototype.toString.call(item) === "[object Array]") {
                result = [];
                item.forEach(function (child, index, array) {
                    result[index] = me.clone(child);
                });
            }
            else if (typeof item == "object") {
                // testing that this is DOM
                if (item.nodeType && typeof item.cloneNode == "function") {
                    result = item.cloneNode(true);
                }
                else if (!item.prototype) { // check that this is a literal
                    if (item instanceof Date) {
                        result = new Date(item);
                    }
                    else {
                        // it is an object literal
                        result = {};
                        for (var i in item) {
                            result[i] = me.clone(item[i]);
                        }
                    }
                }
                else {
                    if (false && item.constructor) {
                        result = new item.constructor();
                    }
                    else {
                        result = item;
                    }
                }
            }
            else {
                result = item;
            }
        }
        return result;
    }
    // froalaModel directive as input: store initial editor content
    set froalaModel(content) {
        this.updateEditor(content);
    }
    stringify(obj) {
        let cache = [];
        let str = JSON.stringify(obj, function (key, value) {
            if (typeof value === "object" && value !== null) {
                if (cache.indexOf(value) !== -1) {
                    // Circular reference found, discard key
                    return;
                }
                // Store value in our collection
                cache.push(value);
            }
            return value;
        });
        cache = null; // reset the cache
        return str;
    }
    // Update editor with model contents.
    updateEditor(content) {
        if (this.stringify(this._oldModel) == this.stringify(content)) {
            return;
        }
        if (!this._hasSpecialTag) {
            this._oldModel = content;
        }
        else {
            this._model = content;
        }
        if (this._editorInitialized) {
            if (!this._hasSpecialTag) {
                this._editor.html.set(content);
            }
            else {
                this.setContent();
            }
        }
        else {
            if (!this._hasSpecialTag) {
                this._element.innerHTML = content || '';
            }
            else {
                this.setContent();
            }
        }
    }
    // update model if editor contentChanged
    updateModel() {
        this.zone.run(() => {
            let modelContent = null;
            if (this._hasSpecialTag) {
                let attributeNodes = this._element.attributes;
                let attrs = {};
                for (let i = 0; i < attributeNodes.length; i++) {
                    let attrName = attributeNodes[i].name;
                    if (this._opts.angularIgnoreAttrs && this._opts.angularIgnoreAttrs.indexOf(attrName) != -1) {
                        continue;
                    }
                    attrs[attrName] = attributeNodes[i].value;
                }
                if (this._element.innerHTML) {
                    attrs[this.INNER_HTML_ATTR] = this._element.innerHTML;
                }
                modelContent = attrs;
            }
            else {
                let returnedHtml = this._editor.html.get();
                if (typeof returnedHtml === 'string') {
                    modelContent = returnedHtml;
                }
            }
            if (this._oldModel !== modelContent) {
                this._oldModel = modelContent;
                // Update froalaModel.
                this.froalaModelChange.emit(modelContent);
                // Update form model.
                this.onChange(modelContent);
            }
        });
    }
    registerEvent(eventName, callback) {
        if (!eventName || !callback) {
            return;
        }
        if (!this._opts.events) {
            this._opts.events = {};
        }
        this._opts.events[eventName] = callback;
    }
    initListeners() {
        let self = this;
        // Check if we have events on the editor.
        if (this._editor.events) {
            // bind contentChange and keyup event to froalaModel
            this._editor.events.on('contentChanged', function () {
                self.updateModel();
            });
            this._editor.events.on('mousedown', function () {
                setTimeout(function () {
                    self.onTouched();
                }, 0);
            });
            if (this._opts.immediateAngularModelUpdate) {
                this._editor.events.on('keyup', function () {
                    setTimeout(function () {
                        self.updateModel();
                    }, 0);
                });
            }
        }
        this._editorInitialized = true;
    }
    createEditor() {
        if (this._editorInitialized) {
            return;
        }
        this.setContent(true);
        // init editor
        this.zone.runOutsideAngular(() => {
            // Add listeners on initialized event.
            if (!this._opts.events)
                this._opts.events = {};
            // Register initialized event.
            this.registerEvent('initialized', this._opts.events && this._opts.events.initialized);
            const existingInitCallback = this._opts.events.initialized;
            // Default initialized event.
            if (!this._opts.events.initialized || !this._opts.events.initialized.overridden) {
                this._opts.events.initialized = () => {
                    this.initListeners();
                    existingInitCallback && existingInitCallback.call(this._editor, this);
                };
                this._opts.events.initialized.overridden = true;
            }
            // Initialize the Froala Editor.
            this._editor = new FroalaEditor(this._element, this._opts);
        });
    }
    setHtml() {
        this._editor.html.set(this._model || "");
        // This will reset the undo stack everytime the model changes externally. Can we fix this?
        this._editor.undo.reset();
        this._editor.undo.saveStep();
    }
    setContent(firstTime = false) {
        let self = this;
        // Set initial content
        if (this._model || this._model == '') {
            this._oldModel = this._model;
            if (this._hasSpecialTag) {
                let tags = this._model;
                // add tags on element
                if (tags) {
                    for (let attr in tags) {
                        if (tags.hasOwnProperty(attr) && attr != this.INNER_HTML_ATTR) {
                            this._element.setAttribute(attr, tags[attr]);
                        }
                    }
                    if (tags.hasOwnProperty(this.INNER_HTML_ATTR)) {
                        this._element.innerHTML = tags[this.INNER_HTML_ATTR];
                    }
                }
            }
            else {
                if (firstTime) {
                    this.registerEvent('initialized', function () {
                        self.setHtml();
                    });
                }
                else {
                    self.setHtml();
                }
            }
        }
    }
    destroyEditor() {
        if (this._editorInitialized) {
            this._editor.destroy();
            this._editorInitialized = false;
        }
    }
    getEditor() {
        if (this._element) {
            return this._editor;
        }
        return null;
    }
    // send manual editor initialization
    generateManualController() {
        let controls = {
            initialize: this.createEditor.bind(this),
            destroy: this.destroyEditor.bind(this),
            getEditor: this.getEditor.bind(this),
        };
        this.froalaInit.emit(controls);
    }
    // TODO not sure if ngOnInit is executed after @inputs
    ngAfterViewInit() {
        // check if output froalaInit is present. Maybe observers is private and should not be used?? TODO how to better test that an output directive is present.
        this.setup();
    }
    setup() {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        if (!this.froalaInit.observers.length) {
            this.createEditor();
        }
        else {
            this.generateManualController();
        }
    }
    ngOnDestroy() {
        this.destroyEditor();
    }
    setDisabledState(isDisabled) {
    }
}
/** @nocollapse */ FroalaEditorDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.9", ngImport: i0, type: FroalaEditorDirective, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Directive });
/** @nocollapse */ FroalaEditorDirective.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "15.2.9", type: FroalaEditorDirective, selector: "[froalaEditor]", inputs: { froalaEditor: "froalaEditor", froalaModel: "froalaModel" }, outputs: { froalaModelChange: "froalaModelChange", froalaInit: "froalaInit" }, providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef((() => FroalaEditorDirective)),
            multi: true
        }
    ], exportAs: ["froalaEditor"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.9", ngImport: i0, type: FroalaEditorDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[froalaEditor]',
                    exportAs: 'froalaEditor',
                    providers: [
                        {
                            provide: NG_VALUE_ACCESSOR,
                            useExisting: forwardRef((() => FroalaEditorDirective)),
                            multi: true
                        }
                    ]
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.NgZone }]; }, propDecorators: { froalaEditor: [{
                type: Input
            }], froalaModel: [{
                type: Input
            }], froalaModelChange: [{
                type: Output
            }], froalaInit: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Byb2plY3RzL2xpYnJhcnkvc3JjL2VkaXRvci9lZGl0b3IuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBd0IsaUJBQWlCLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6RSxPQUFPLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRXZHLE9BQU8sWUFBWSxNQUFNLGVBQWUsQ0FBQzs7QUFhekMsTUFBTSxPQUFPLHFCQUFxQjtJQXdCaEMsWUFBWSxFQUFjLEVBQVUsSUFBWTtRQUFaLFNBQUksR0FBSixJQUFJLENBQVE7UUF0QmhELGlCQUFpQjtRQUNULFVBQUssR0FBUTtZQUNuQiwyQkFBMkIsRUFBRSxLQUFLO1lBQ2xDLGtCQUFrQixFQUFFLElBQUk7U0FDekIsQ0FBQztRQUlNLGlCQUFZLEdBQWEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN6RCxvQkFBZSxHQUFXLFdBQVcsQ0FBQztRQUN0QyxtQkFBYyxHQUFZLEtBQUssQ0FBQztRQVFoQyx1QkFBa0IsR0FBWSxLQUFLLENBQUM7UUFFcEMsY0FBUyxHQUFXLElBQUksQ0FBQztRQWVqQyxxQ0FBcUM7UUFDckMsYUFBUSxHQUFHLENBQUMsQ0FBTSxFQUFFLEVBQUU7UUFDdEIsQ0FBQyxDQUFDO1FBQ0YsY0FBUyxHQUFHLEdBQUcsRUFBRTtRQUNqQixDQUFDLENBQUM7UUEySEYseUVBQXlFO1FBQy9ELHNCQUFpQixHQUFzQixJQUFJLFlBQVksRUFBTyxDQUFDO1FBRXpFLG9FQUFvRTtRQUMxRCxlQUFVLEdBQXlCLElBQUksWUFBWSxFQUFVLENBQUM7UUFnTWhFLGdCQUFXLEdBQUcsS0FBSyxDQUFD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RUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxnQkFBZ0IsQ0FBQyxVQUFtQjtJQUNwQyxDQUFDOztxSUExWFUscUJBQXFCO3lIQUFyQixxQkFBcUIsOExBUnJCO1FBQ1Q7WUFDRSxPQUFPLEVBQUUsaUJBQWlCO1lBQzFCLFdBQVcsRUFBRSxVQUFVLEVBQUMsR0FBRyxFQUFFLENBQUMscUJBQXFCLEVBQUM7WUFDcEQsS0FBSyxFQUFFLElBQUk7U0FDWjtLQUNGOzJGQUVVLHFCQUFxQjtrQkFYakMsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsZ0JBQWdCO29CQUMxQixRQUFRLEVBQUUsY0FBYztvQkFDeEIsU0FBUyxFQUFFO3dCQUNUOzRCQUNFLE9BQU8sRUFBRSxpQkFBaUI7NEJBQzFCLFdBQVcsRUFBRSxVQUFVLEVBQUMsR0FBRyxFQUFFLHNCQUFzQixFQUFDOzRCQUNwRCxLQUFLLEVBQUUsSUFBSTt5QkFDWjtxQkFDRjtpQkFDRjtzSEErRGMsWUFBWTtzQkFBeEIsS0FBSztnQkFzRE8sV0FBVztzQkFBdkIsS0FBSztnQkFpREksaUJBQWlCO3NCQUExQixNQUFNO2dCQUdHLFVBQVU7c0JBQW5CLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb250cm9sVmFsdWVBY2Nlc3NvciwgTkdfVkFMVUVfQUNDRVNTT1IgfSBmcm9tIFwiQGFuZ3VsYXIvZm9ybXNcIjtcbmltcG9ydCB7IERpcmVjdGl2ZSwgRWxlbWVudFJlZiwgRXZlbnRFbWl0dGVyLCBmb3J3YXJkUmVmLCBJbnB1dCwgTmdab25lLCBPdXRwdXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IEZyb2FsYUVkaXRvciBmcm9tICdmcm9hbGEtZWRpdG9yJztcblxuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Zyb2FsYUVkaXRvcl0nLFxuICBleHBvcnRBczogJ2Zyb2FsYUVkaXRvcicsXG4gIHByb3ZpZGVyczogW1xuICAgIHtcbiAgICAgIHByb3ZpZGU6IE5HX1ZBTFVFX0FDQ0VTU09SLFxuICAgICAgdXNlRXhpc3Rpbmc6IGZvcndhcmRSZWYoKCkgPT4gRnJvYWxhRWRpdG9yRGlyZWN0aXZlKSxcbiAgICAgIG11bHRpOiB0cnVlXG4gICAgfVxuICBdXG59KVxuZXhwb3J0IGNsYXNzIEZyb2FsYUVkaXRvckRpcmVjdGl2ZSBpbXBsZW1lbnRzIENvbnRyb2xWYWx1ZUFjY2Vzc29yIHtcblxuICAvLyBlZGl0b3Igb3B0aW9uc1xuICBwcml2YXRlIF9vcHRzOiBhbnkgPSB7XG4gICAgaW1tZWRpYXRlQW5ndWxhck1vZGVsVXBkYXRlOiBmYWxzZSxcbiAgICBhbmd1bGFySWdub3JlQXR0cnM6IG51bGxcbiAgfTtcblxuICBwcml2YXRlIF9lbGVtZW50OiBhbnk7XG5cbiAgcHJpdmF0ZSBTUEVDSUFMX1RBR1M6IHN0cmluZ1tdID0gWydpbWcnLCAnYnV0dG9uJywgJ2lucHV0JywgJ2EnXTtcbiAgcHJpdmF0ZSBJTk5FUl9IVE1MX0FUVFI6IHN0cmluZyA9ICdpbm5lckhUTUwnO1xuICBwcml2YXRlIF9oYXNTcGVjaWFsVGFnOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLy8gZWRpdG9yIGVsZW1lbnRcbiAgcHJpdmF0ZSBfZWRpdG9yOiBhbnk7XG5cbiAgLy8gaW5pdGlhbCBlZGl0b3IgY29udGVudFxuICBwcml2YXRlIF9tb2RlbDogc3RyaW5nO1xuXG4gIHByaXZhdGUgX2VkaXRvckluaXRpYWxpemVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgcHJpdmF0ZSBfb2xkTW9kZWw6IHN0cmluZyA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoZWw6IEVsZW1lbnRSZWYsIHByaXZhdGUgem9uZTogTmdab25lKSB7XG5cbiAgICBsZXQgZWxlbWVudDogYW55ID0gZWwubmF0aXZlRWxlbWVudDtcblxuICAgIC8vIGNoZWNrIGlmIHRoZSBlbGVtZW50IGlzIGEgc3BlY2lhbCB0YWdcbiAgICBpZiAodGhpcy5TUEVDSUFMX1RBR1MuaW5kZXhPZihlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSkgIT0gLTEpIHtcbiAgICAgIHRoaXMuX2hhc1NwZWNpYWxUYWcgPSB0cnVlO1xuICAgIH1cbiAgICB0aGlzLl9lbGVtZW50ID0gZWxlbWVudDtcblxuICAgIHRoaXMuem9uZSA9IHpvbmU7XG4gIH1cblxuICAvLyBCZWdpbiBDb250cm9sVmFsdWVBY2Nlc29yIG1ldGhvZHMuXG4gIG9uQ2hhbmdlID0gKF86IGFueSkgPT4ge1xuICB9O1xuICBvblRvdWNoZWQgPSAoKSA9PiB7XG4gIH07XG5cbiAgLy8gRm9ybSBtb2RlbCBjb250ZW50IGNoYW5nZWQuXG4gIHdyaXRlVmFsdWUoY29udGVudDogYW55KTogdm9pZCB7XG4gICAgdGhpcy51cGRhdGVFZGl0b3IoY29udGVudCk7XG4gICAgaWYoY29udGVudCl7XG4gICAgICB0aGlzLnNldHVwKCk7XG4gICAgfVxuICB9XG5cbiAgcmVnaXN0ZXJPbkNoYW5nZShmbjogKF86IGFueSkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMub25DaGFuZ2UgPSBmbjtcbiAgfVxuXG4gIHJlZ2lzdGVyT25Ub3VjaGVkKGZuOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5vblRvdWNoZWQgPSBmbjtcbiAgfVxuXG4gIC8vIEVuZCBDb250cm9sVmFsdWVBY2Nlc29yIG1ldGhvZHMuXG5cbiAgLy8gZnJvYWxhRWRpdG9yIGRpcmVjdGl2ZSBhcyBpbnB1dDogc3RvcmUgdGhlIGVkaXRvciBvcHRpb25zXG4gIEBJbnB1dCgpIHNldCBmcm9hbGFFZGl0b3Iob3B0czogYW55KSB7XG4gICAgdGhpcy5fb3B0cyA9IHRoaXMuY2xvbmUoICBvcHRzIHx8IHRoaXMuX29wdHMpO1xuICAgIHRoaXMuX29wdHMgPSAgey4uLnRoaXMuX29wdHN9O1xuICB9XG5cbiAgIC8vIFRPRE86IHJlcGxhY2UgY2xvbmUgbWV0aG9kIHdpdGggYmV0dGVyIHBvc3NpYmxlIGFsdGVybmF0ZSBcbiAgcHJpdmF0ZSBjbG9uZShpdGVtKSB7XG4gIFx0Y29uc3QgbWUgPSB0aGlzOyAgXG4gICAgICBpZiAoIWl0ZW0pIHsgcmV0dXJuIGl0ZW07IH0gLy8gbnVsbCwgdW5kZWZpbmVkIHZhbHVlcyBjaGVja1xuXG4gICAgICBsZXQgdHlwZXMgPSBbIE51bWJlciwgU3RyaW5nLCBCb29sZWFuIF0sIFxuICAgICAgICAgIHJlc3VsdDtcblxuICAgICAgLy8gbm9ybWFsaXppbmcgcHJpbWl0aXZlcyBpZiBzb21lb25lIGRpZCBuZXcgU3RyaW5nKCdhYWEnKSwgb3IgbmV3IE51bWJlcignNDQ0Jyk7XG4gICAgICB0eXBlcy5mb3JFYWNoKGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgICBpZiAoaXRlbSBpbnN0YW5jZW9mIHR5cGUpIHtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gdHlwZSggaXRlbSApO1xuICAgICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCggaXRlbSApID09PSBcIltvYmplY3QgQXJyYXldXCIpIHtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gW107XG4gICAgICAgICAgICAgIGl0ZW0uZm9yRWFjaChmdW5jdGlvbihjaGlsZCwgaW5kZXgsIGFycmF5KSB7IFxuICAgICAgICAgICAgICAgICAgcmVzdWx0W2luZGV4XSA9IG1lLmNsb25lKCBjaGlsZCApO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpdGVtID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgLy8gdGVzdGluZyB0aGF0IHRoaXMgaXMgRE9NXG4gICAgICAgICAgICAgIGlmIChpdGVtLm5vZGVUeXBlICYmIHR5cGVvZiBpdGVtLmNsb25lTm9kZSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGl0ZW0uY2xvbmVOb2RlKCB0cnVlICk7ICAgIFxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFpdGVtLnByb3RvdHlwZSkgeyAvLyBjaGVjayB0aGF0IHRoaXMgaXMgYSBsaXRlcmFsXG4gICAgICAgICAgICAgICAgICBpZiAoaXRlbSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgRGF0ZShpdGVtKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gaXQgaXMgYW4gb2JqZWN0IGxpdGVyYWxcbiAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2ldID0gbWUuY2xvbmUoIGl0ZW1baV0gKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBpZiAoZmFsc2UgJiYgaXRlbS5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBpdGVtLmNvbnN0cnVjdG9yKCk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGl0ZW07XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXN1bHQgPSBpdGVtO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgLy8gZnJvYWxhTW9kZWwgZGlyZWN0aXZlIGFzIGlucHV0OiBzdG9yZSBpbml0aWFsIGVkaXRvciBjb250ZW50XG4gIEBJbnB1dCgpIHNldCBmcm9hbGFNb2RlbChjb250ZW50OiBhbnkpIHtcbiAgICB0aGlzLnVwZGF0ZUVkaXRvcihjb250ZW50KTtcbiAgfVxuXG4gIHByaXZhdGUgc3RyaW5naWZ5KG9iaikge1xuICAgIGxldCBjYWNoZSA9IFtdO1xuICAgIGxldCBzdHIgPSBKU09OLnN0cmluZ2lmeShvYmosIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKGNhY2hlLmluZGV4T2YodmFsdWUpICE9PSAtMSkge1xuICAgICAgICAgIC8vIENpcmN1bGFyIHJlZmVyZW5jZSBmb3VuZCwgZGlzY2FyZCBrZXlcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gU3RvcmUgdmFsdWUgaW4gb3VyIGNvbGxlY3Rpb25cbiAgICAgICAgY2FjaGUucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSk7XG4gICAgY2FjaGUgPSBudWxsOyAvLyByZXNldCB0aGUgY2FjaGVcbiAgICByZXR1cm4gc3RyO1xuICB9XG4gIFxuICAgIC8vIFVwZGF0ZSBlZGl0b3Igd2l0aCBtb2RlbCBjb250ZW50cy5cbiAgICBwcml2YXRlIHVwZGF0ZUVkaXRvcihjb250ZW50OiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLnN0cmluZ2lmeSh0aGlzLl9vbGRNb2RlbCkgPT0gdGhpcy5zdHJpbmdpZnkoY29udGVudCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICBcbiAgICBpZiAoIXRoaXMuX2hhc1NwZWNpYWxUYWcpIHtcbiAgICAgIHRoaXMuX29sZE1vZGVsID0gY29udGVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fbW9kZWwgPSBjb250ZW50O1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9lZGl0b3JJbml0aWFsaXplZCkge1xuICAgICAgaWYgKCF0aGlzLl9oYXNTcGVjaWFsVGFnKSB7XG4gICAgICAgIHRoaXMuX2VkaXRvci5odG1sLnNldChjb250ZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2V0Q29udGVudCgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIXRoaXMuX2hhc1NwZWNpYWxUYWcpIHtcbiAgICAgICAgdGhpcy5fZWxlbWVudC5pbm5lckhUTUwgPSBjb250ZW50IHx8ICcnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zZXRDb250ZW50KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gZnJvYWxhTW9kZWwgZGlyZWN0aXZlIGFzIG91dHB1dDogdXBkYXRlIG1vZGVsIGlmIGVkaXRvciBjb250ZW50Q2hhbmdlZFxuICBAT3V0cHV0KCkgZnJvYWxhTW9kZWxDaGFuZ2U6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG5cbiAgLy8gZnJvYWxhSW5pdCBkaXJlY3RpdmUgYXMgb3V0cHV0OiBzZW5kIG1hbnVhbCBlZGl0b3IgaW5pdGlhbGl6YXRpb25cbiAgQE91dHB1dCgpIGZyb2FsYUluaXQ6IEV2ZW50RW1pdHRlcjxPYmplY3Q+ID0gbmV3IEV2ZW50RW1pdHRlcjxPYmplY3Q+KCk7XG5cbiAgLy8gdXBkYXRlIG1vZGVsIGlmIGVkaXRvciBjb250ZW50Q2hhbmdlZFxuICBwcml2YXRlIHVwZGF0ZU1vZGVsKCkge1xuICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuXG4gICAgICBsZXQgbW9kZWxDb250ZW50OiBhbnkgPSBudWxsO1xuXG4gICAgICBpZiAodGhpcy5faGFzU3BlY2lhbFRhZykge1xuXG4gICAgICAgIGxldCBhdHRyaWJ1dGVOb2RlcyA9IHRoaXMuX2VsZW1lbnQuYXR0cmlidXRlcztcbiAgICAgICAgbGV0IGF0dHJzID0ge307XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRyaWJ1dGVOb2Rlcy5sZW5ndGg7IGkrKykge1xuXG4gICAgICAgICAgbGV0IGF0dHJOYW1lID0gYXR0cmlidXRlTm9kZXNbaV0ubmFtZTtcbiAgICAgICAgICBpZiAodGhpcy5fb3B0cy5hbmd1bGFySWdub3JlQXR0cnMgJiYgdGhpcy5fb3B0cy5hbmd1bGFySWdub3JlQXR0cnMuaW5kZXhPZihhdHRyTmFtZSkgIT0gLTEpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGF0dHJzW2F0dHJOYW1lXSA9IGF0dHJpYnV0ZU5vZGVzW2ldLnZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2VsZW1lbnQuaW5uZXJIVE1MKSB7XG4gICAgICAgICAgYXR0cnNbdGhpcy5JTk5FUl9IVE1MX0FUVFJdID0gdGhpcy5fZWxlbWVudC5pbm5lckhUTUw7XG4gICAgICAgIH1cblxuICAgICAgICBtb2RlbENvbnRlbnQgPSBhdHRycztcbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgbGV0IHJldHVybmVkSHRtbDogYW55ID0gdGhpcy5fZWRpdG9yLmh0bWwuZ2V0KCk7XG4gICAgICAgIGlmICh0eXBlb2YgcmV0dXJuZWRIdG1sID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIG1vZGVsQ29udGVudCA9IHJldHVybmVkSHRtbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX29sZE1vZGVsICE9PSBtb2RlbENvbnRlbnQpIHtcbiAgICAgICAgdGhpcy5fb2xkTW9kZWwgPSBtb2RlbENvbnRlbnQ7XG5cbiAgICAgICAgLy8gVXBkYXRlIGZyb2FsYU1vZGVsLlxuICAgICAgICB0aGlzLmZyb2FsYU1vZGVsQ2hhbmdlLmVtaXQobW9kZWxDb250ZW50KTtcblxuICAgICAgICAvLyBVcGRhdGUgZm9ybSBtb2RlbC5cbiAgICAgICAgdGhpcy5vbkNoYW5nZShtb2RlbENvbnRlbnQpO1xuICAgICAgfVxuXG4gICAgfSlcbiAgfVxuXG4gIHByaXZhdGUgcmVnaXN0ZXJFdmVudChldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCFldmVudE5hbWUgfHwgIWNhbGxiYWNrKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9vcHRzLmV2ZW50cykge1xuICAgICAgdGhpcy5fb3B0cy5ldmVudHMgPSB7fTtcbiAgICB9XG5cbiAgICB0aGlzLl9vcHRzLmV2ZW50c1tldmVudE5hbWVdID0gY2FsbGJhY2s7XG4gIH1cblxuICBwcml2YXRlIGluaXRMaXN0ZW5lcnMoKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIC8vIENoZWNrIGlmIHdlIGhhdmUgZXZlbnRzIG9uIHRoZSBlZGl0b3IuXG4gICAgaWYgKHRoaXMuX2VkaXRvci5ldmVudHMpIHtcbiAgICAgIC8vIGJpbmQgY29udGVudENoYW5nZSBhbmQga2V5dXAgZXZlbnQgdG8gZnJvYWxhTW9kZWxcbiAgICAgIHRoaXMuX2VkaXRvci5ldmVudHMub24oJ2NvbnRlbnRDaGFuZ2VkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnVwZGF0ZU1vZGVsKCk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2VkaXRvci5ldmVudHMub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgc2VsZi5vblRvdWNoZWQoKTtcbiAgICAgICAgfSwgMCk7XG4gICAgICB9KTtcblxuICAgICAgaWYgKHRoaXMuX29wdHMuaW1tZWRpYXRlQW5ndWxhck1vZGVsVXBkYXRlKSB7XG4gICAgICAgIHRoaXMuX2VkaXRvci5ldmVudHMub24oJ2tleXVwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi51cGRhdGVNb2RlbCgpO1xuICAgICAgICAgIH0sIDApO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9lZGl0b3JJbml0aWFsaXplZCA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUVkaXRvcigpIHtcbiAgICBpZiAodGhpcy5fZWRpdG9ySW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnNldENvbnRlbnQodHJ1ZSk7XG5cbiAgICAvLyBpbml0IGVkaXRvclxuICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAvLyBBZGQgbGlzdGVuZXJzIG9uIGluaXRpYWxpemVkIGV2ZW50LlxuICAgICAgaWYgKCF0aGlzLl9vcHRzLmV2ZW50cykgdGhpcy5fb3B0cy5ldmVudHMgPSB7fTtcblxuICAgICAgLy8gUmVnaXN0ZXIgaW5pdGlhbGl6ZWQgZXZlbnQuXG4gICAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoJ2luaXRpYWxpemVkJywgdGhpcy5fb3B0cy5ldmVudHMgJiYgdGhpcy5fb3B0cy5ldmVudHMuaW5pdGlhbGl6ZWQpO1xuICAgICAgY29uc3QgZXhpc3RpbmdJbml0Q2FsbGJhY2sgPSB0aGlzLl9vcHRzLmV2ZW50cy5pbml0aWFsaXplZDtcbiAgICAgIC8vIERlZmF1bHQgaW5pdGlhbGl6ZWQgZXZlbnQuXG4gICAgICBpZiAoIXRoaXMuX29wdHMuZXZlbnRzLmluaXRpYWxpemVkIHx8ICF0aGlzLl9vcHRzLmV2ZW50cy5pbml0aWFsaXplZC5vdmVycmlkZGVuKSB7XG4gICAgICAgIHRoaXMuX29wdHMuZXZlbnRzLmluaXRpYWxpemVkID0gKCkgPT4ge1xuICAgICAgICAgIHRoaXMuaW5pdExpc3RlbmVycygpO1xuICAgICAgICAgIGV4aXN0aW5nSW5pdENhbGxiYWNrICYmIGV4aXN0aW5nSW5pdENhbGxiYWNrLmNhbGwodGhpcy5fZWRpdG9yLCB0aGlzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fb3B0cy5ldmVudHMuaW5pdGlhbGl6ZWQub3ZlcnJpZGRlbiA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEluaXRpYWxpemUgdGhlIEZyb2FsYSBFZGl0b3IuXG4gICAgICB0aGlzLl9lZGl0b3IgPSBuZXcgRnJvYWxhRWRpdG9yKFxuICAgICAgICB0aGlzLl9lbGVtZW50LFxuICAgICAgICB0aGlzLl9vcHRzXG4gICAgICApO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRIdG1sKCkge1xuICAgIHRoaXMuX2VkaXRvci5odG1sLnNldCh0aGlzLl9tb2RlbCB8fCBcIlwiKTtcblxuICAgIC8vIFRoaXMgd2lsbCByZXNldCB0aGUgdW5kbyBzdGFjayBldmVyeXRpbWUgdGhlIG1vZGVsIGNoYW5nZXMgZXh0ZXJuYWxseS4gQ2FuIHdlIGZpeCB0aGlzP1xuICAgIHRoaXMuX2VkaXRvci51bmRvLnJlc2V0KCk7XG4gICAgdGhpcy5fZWRpdG9yLnVuZG8uc2F2ZVN0ZXAoKTtcbiAgfVxuXG4gIHByaXZhdGUgc2V0Q29udGVudChmaXJzdFRpbWUgPSBmYWxzZSkge1xuICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgIC8vIFNldCBpbml0aWFsIGNvbnRlbnRcbiAgICBpZiAodGhpcy5fbW9kZWwgfHwgdGhpcy5fbW9kZWwgPT0gJycpIHtcbiAgICAgIHRoaXMuX29sZE1vZGVsID0gdGhpcy5fbW9kZWw7XG4gICAgICBpZiAodGhpcy5faGFzU3BlY2lhbFRhZykge1xuXG4gICAgICAgIGxldCB0YWdzOiBPYmplY3QgPSB0aGlzLl9tb2RlbDtcblxuICAgICAgICAvLyBhZGQgdGFncyBvbiBlbGVtZW50XG4gICAgICAgIGlmICh0YWdzKSB7XG5cbiAgICAgICAgICBmb3IgKGxldCBhdHRyIGluIHRhZ3MpIHtcbiAgICAgICAgICAgIGlmICh0YWdzLmhhc093blByb3BlcnR5KGF0dHIpICYmIGF0dHIgIT0gdGhpcy5JTk5FUl9IVE1MX0FUVFIpIHtcbiAgICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5zZXRBdHRyaWJ1dGUoYXR0ciwgdGFnc1thdHRyXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRhZ3MuaGFzT3duUHJvcGVydHkodGhpcy5JTk5FUl9IVE1MX0FUVFIpKSB7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50LmlubmVySFRNTCA9IHRhZ3NbdGhpcy5JTk5FUl9IVE1MX0FUVFJdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGZpcnN0VGltZSkge1xuICAgICAgICAgIHRoaXMucmVnaXN0ZXJFdmVudCgnaW5pdGlhbGl6ZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLnNldEh0bWwoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLnNldEh0bWwoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZGVzdHJveUVkaXRvcigpIHtcbiAgICBpZiAodGhpcy5fZWRpdG9ySW5pdGlhbGl6ZWQpIHtcbiAgICAgIHRoaXMuX2VkaXRvci5kZXN0cm95KCk7XG4gICAgICB0aGlzLl9lZGl0b3JJbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0RWRpdG9yKCkge1xuICAgIGlmICh0aGlzLl9lbGVtZW50KSB7XG4gICAgICByZXR1cm4gdGhpcy5fZWRpdG9yO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gc2VuZCBtYW51YWwgZWRpdG9yIGluaXRpYWxpemF0aW9uXG4gIHByaXZhdGUgZ2VuZXJhdGVNYW51YWxDb250cm9sbGVyKCkge1xuICAgIGxldCBjb250cm9scyA9IHtcbiAgICAgIGluaXRpYWxpemU6IHRoaXMuY3JlYXRlRWRpdG9yLmJpbmQodGhpcyksXG4gICAgICBkZXN0cm95OiB0aGlzLmRlc3Ryb3lFZGl0b3IuYmluZCh0aGlzKSxcbiAgICAgIGdldEVkaXRvcjogdGhpcy5nZXRFZGl0b3IuYmluZCh0aGlzKSxcbiAgICB9O1xuICAgIHRoaXMuZnJvYWxhSW5pdC5lbWl0KGNvbnRyb2xzKTtcbiAgfVxuXG4gIC8vIFRPRE8gbm90IHN1cmUgaWYgbmdPbkluaXQgaXMgZXhlY3V0ZWQgYWZ0ZXIgQGlucHV0c1xuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgLy8gY2hlY2sgaWYgb3V0cHV0IGZyb2FsYUluaXQgaXMgcHJlc2VudC4gTWF5YmUgb2JzZXJ2ZXJzIGlzIHByaXZhdGUgYW5kIHNob3VsZCBub3QgYmUgdXNlZD8/IFRPRE8gaG93IHRvIGJldHRlciB0ZXN0IHRoYXQgYW4gb3V0cHV0IGRpcmVjdGl2ZSBpcyBwcmVzZW50LlxuICAgIHRoaXMuc2V0dXAoKTtcbiAgfVxuXG4gIHByaXZhdGUgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBzZXR1cCgpIHtcbiAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICBpZiAoIXRoaXMuZnJvYWxhSW5pdC5vYnNlcnZlcnMubGVuZ3RoKSB7XG4gICAgICB0aGlzLmNyZWF0ZUVkaXRvcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmdlbmVyYXRlTWFudWFsQ29udHJvbGxlcigpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuZGVzdHJveUVkaXRvcigpO1xuICB9XG5cbiAgc2V0RGlzYWJsZWRTdGF0ZShpc0Rpc2FibGVkOiBib29sZWFuKTogdm9pZCB7XG4gIH1cbn1cbiJdfQ==