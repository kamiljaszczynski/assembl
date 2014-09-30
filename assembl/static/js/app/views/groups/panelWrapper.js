define(function (require) {

    var Marionette = require('marionette'),
        panelClassByTypeName = require('objects/viewsFactory'),
        Ctx = require('modules/context'),
        AssemblPanel = require('views/assemblPanel'),
        i18n = require('utils/i18n'),
        panelSpec = require('models/panelSpec');

    /**
     * A wrapper for a panel, used anywhere in a panelGroup
     */
    var PanelWrapper = Marionette.LayoutView.extend({
        template: "#tmpl-panelWrapper",
        regions: {
            contents: '.panelContents'
        },
        panelType: "groupPanel",
        className: "groupPanel",
        modelEvents: {
            "change:hidden": "setHidden"
        },
        ui: {
            title: ".panel-header-title"
        },
        events: {
            'click .panel-header-close': 'closePanel',
            'click .js_lockPanel': 'toggleLock',
            'click .js_minimizePanel': 'toggleMinimize'
        },

        _unlockCallbackQueue: {},
        _stateButton: null,
        _minimizedStateButton: null,
        _originalWidth: null,
        _nextElementOriginalWidth: null,

        initialize: function (options) {
            var contentClass = panelClassByTypeName(options.contentSpec);
            this.groupContent = options.groupContent;
            this.contentsView = new contentClass({
                groupContent: options.groupContent,
                panelWrapper: this
            });
            this.gridSize = this.contentsView.gridSize || AssemblPanel.prototype.DEFAULT_GRID_SIZE;
            this.minWidth = this.contentsView.minWidth || AssemblPanel.prototype.DEFAULT_MIN_SIZE;
            Marionette.bindEntityEvents(this, this.model, this.modelEvents);

            this.model.set('minimized', false); // TODO: memorize previous state and apply it
        },
        serializeData: function () {

            return {
                hideHeader: this.contentsView.hideHeader || false,
                title: this.contentsView.getTitle(),
                tooltip: this.contentsView.tooltip || '',
                headerClass: this.contentsView.headerClass || '',
                userCanChangeUi: Ctx.userCanChangeUi(),
                hasLock: this.contentsView.lockable,
                hasMinimize: this.contentsView.minimizeable,
                hasClose: this.contentsView.closeable,
                icon: this.getIcon()
            }
        },
        resetTitle: function (newTitle) {
            this.ui.title.html(newTitle);
        },
        /**
         * Closes the panel
         */
        closePanel: function () {
            Ctx.removeCurrentlyDisplayedTooltips();
            this.model.collection.remove(this.model);
            this.groupContent.groupContainer.resizeAllPanels();
        },
        onRender: function () {
            this.setGridSize(this.gridSize);
            this.contents.show(this.contentsView);
            this.setHidden();
            Ctx.initTooltips(this.$el);
            this._stateButton = this.$('.lock-group i');
            this._minimizedStateButton = this.$('.panel-header-minimize');
        },
        setHidden: function () {
            if (this.model.get('hidden')) {
                this.$el.hide();
            } else {
                this.$el.css('display', 'table-cell');
            }
            this.groupContent.groupContainer.resizeAllPanels();
        },
        setGridSize: function (gridSize) {
            this.gridSize = gridSize;
            //this.groupContent.adjustGridSize();
        },

        /**
         * lock the panel if unlocked
         */
        lockPanel: function () {
            if (!this.model.get('locked')) {
                this.model.set('locked', true);
                this._stateButton
                    .addClass('icon-lock')
                    .removeClass('icon-lock-open')
                    .attr('data-original-title', i18n.gettext('Unlock panel'));
            }
        },

        /**
         * unlock the panel if locked
         */
        unlockPanel: function () {
            if (this.model.get('locked')) {
                this.model.set('locked', false);
                this._stateButton
                    .addClass('icon-lock-open')
                    .removeClass('icon-lock')
                    .attr('data-original-title', i18n.gettext('Lock panel'));

                if (_.size(this._unlockCallbackQueue) > 0) {
                    //console.log("Executing queued callbacks in queue: ",this.unlockCallbackQueue);
                    _.each(this._unlockCallbackQueue, function (callback) {
                        callback();
                    });
                    //We presume the callbacks have their own calls to render
                    //this.render();
                    this._unlockCallbackQueue = {};
                }
            }
        },
        /**
         * Toggle the lock state of the panel
         */
        toggleLock: function () {
            if (this.isPanelLocked()) {
                this.unlockPanel();
            } else {
                this.lockPanel();
            }
        },

        isPanelLocked: function () {
            return this.model.get('locked');
        },

        toggleMinimize: function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            if (this.isPanelMinimized()) {
                this.unminimizePanel();
            } else {
                this.minimizePanel();
            }
        },

        isPanelMinimized: function () {
            return this.model.get('minimized');
        },

        unminimizePanel: function () {
            if (!this.model.get('minimized'))
                return;
            if (this.model.get("type") == "ideaPanel" && Ctx.getCurrentIdea() == undefined) {
                // do not accept to unminimize if no idea to show
                return;
            }

            var compensateElement = this.$el.nextAll(":visible:not(.minimized)").last();
            this.model.set('minimized', false);
            this._minimizedStateButton
                //.addClass('icon-collapse')
                //.removeClass('icon-expand')
                .attr('data-original-title', i18n.gettext('Minimize panel'));

            //this.$el.css("width", this._originalWidth+"px");
            //this.$el.animate({ "width": this._originalWidth+"px"}, 1000);
            //compensateElement.css("width", this._nextElementOriginalWidth+"px");
            //compensateElement.animate({"width": this._nextElementOriginalWidth+"px"}, 1000);
            var el = this.$el;
            this.$el.addClass("minimizing");

            this.$el.children(".panelContents").show();
            this.$el.find("header span.panel-header-title").show();
            this.$el.children(".panelContentsWhenMinimized").hide();
            if (this.model.get("type") == "ideaPanel") {
                this.groupContent.resetMessagePanelWidth();
            }
            this.groupContent.groupContainer.resizeAllPanels();
        },

        minimizePanel: function () {
            if (this.model.get('minimized'))
                return;
            var compensateElement = this.$el.nextAll(":visible:not(.minimized)").last();
            this._originalWidth = this.$el.width();
            this._nextElementOriginalWidth = compensateElement.width();
            
            this.model.set('minimized', true);
            this._minimizedStateButton
                //.addClass('icon-expand')
                //.removeClass('icon-collapse')
                .attr('data-original-title', i18n.gettext('Maximize panel'));

            
            var targetWidth = 40;
            var currentWidth = this.$el.width();
            var diffWidth = currentWidth - targetWidth;
            var nextElementCurrentWidth = compensateElement.width();
            //this.$el.css("width", targetWidth+"px");
            //this.$el.animate({ "width": targetWidth+"px"}, 1000);
            //compensateElement.css("width", (nextElementCurrentWidth+diffWidth) + "px");
            //compensateElement.animate({ "width": (nextElementCurrentWidth+diffWidth) + "px"}, 1000);
            this.$el.addClass("minimizing");

            this.$el.children(".panelContents").hide();
            this.$el.find("header span.panel-header-title").hide();
            this.$el.children(".panelContentsWhenMinimized").show();
            if (this.model.get("type") == "ideaPanel") {
                this.groupContent.resetMessagePanelWidth();
            }
            this.groupContent.groupContainer.resizeAllPanels();
        },

        setButtonState: function (dom) {
            this._stateButton = dom;
        },

        getExtraPixels: function (include_embedded_idea_panel) {
            if (this.model.get('minimized')) {
                return AssemblPanel.prototype.minimized_size;
            }
            return 0;
        },

        useCurrentSize: function() {
            this.$el.stop();
            this.$el.width(this.$el.width());
            this.$el.addClass("animating");
        },

        animateTowardsPixels: function(pixels_per_unit, percent_per_unit, extra_pixels, num_units, group_units) {
            var that = this;
            if (this.model.get('minimized')) {
                var target = AssemblPanel.prototype.minimized_size;
                this.$el.animate({'width': target}, 1000, 'swing', function() {
                    that.$el.removeClass("animating");
                    that.$el.addClass("minimized");
                    that.$el.removeClass("minimizing");
                    that.$el.css("min-width", AssemblPanel.prototype.minimized_size);
                });
            } else {
                that.$el.removeClass("minimized");
                var gridSize = this.gridSize;
                var myCorrection = extra_pixels / num_units;
                if (this.groupContent.groupContainer.isOneNavigationGroup()
                    && this.model.get('type') == 'messageList'
                    && this.groupContent.model.getPanelSpecByType('ideaPanel').get('minimized')) {
                        myCorrection += AssemblPanel.prototype.minimized_size;
                }
                if (isNaN(myCorrection))
                    alert("error");
                myCorrection = Math.round(myCorrection);
                var target = pixels_per_unit * gridSize;
                this.$el.animate({'width': target}, 1000, 'swing', function() {
                    var before = that.$el.width();
                    var width = Math.round(100*gridSize/group_units)+"%";
                    if (myCorrection > 0) {
                        width = "calc("+width+" - "+Math.round(myCorrection)+"px)";
                    }
                    that.$el.width(width);
                    console.log(that.model.get('type'), target, before, that.$el.width(), width);
                    that.$el.removeClass("animating");
                    that.$el.css("min-width", that.minWidth);
                });
            }
        },

        /**
         * Process a callback that can be inhibited by panel locking.
         * If the panel is unlocked, the callback will be called immediately.
         * If the panel is locked, visual notifications will be shown, and the
         * callback will be memorized in a queue, removing duplicates.
         * Callbacks receive no parameters.
         * If queued, they must assume that they can be called at a later time,
         * and have the means of getting any updated information they need.
         */
        filterThroughPanelLock: function (callback, queueWithId) {
            if (!this.model.get('locked')) {
                callback();

            } else {
                if (queueWithId) {
                    if (this._unlockCallbackQueue[queueWithId] !== undefined) {
                    }
                    else {
                        this._unlockCallbackQueue[queueWithId] = callback;
                    }
                }
            }
        },

        getIcon: function () {
            var type = this.contentsView.panelType,
                icon = '';

            switch (type) {
                case'ideaPanel':
                    icon = 'icon-idea';
                    break;
                case'messageList':
                    icon = 'icon-comment';
                    break;
                case'clipboard':
                    // ne need because of resetTitle - segment
                    break;
                case'synthesisPanel':
                    icon = 'icon-doc';
                    break;
                case'homePanel':
                    break;
                case'ideaList':
                    icon = 'icon-discuss';
                    break;
                default:
                    break;
            }

            return icon;
        }
    });
    return PanelWrapper;
});