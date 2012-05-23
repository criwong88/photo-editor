
window.log = function f(){ log.history = log.history || []; log.history.push(arguments); if(this.console) { var args = arguments, newarr; try { args.callee = f.caller } catch(e) {}; newarr = [].slice.call(args); if (typeof console.log === 'object') log.apply.call(console.log, console, newarr); else console.log.apply(console, newarr);}};

(function(a){function b(){}for(var c="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),d;!!(d=c.pop());){a[d]=a[d]||b;}})
(function(){try{console.log();return window.console;}catch(a){return (window.console={});}}());

$("#debug").click(function() {
    $(this).toggleClass("active");
    return false;
});

var SamplePhotos = [
    "photos/Chrysanthemum.jpg", "photos/Desert.jpg", "photos/Hydrangeas.jpg", 
    "photos/Jellyfish.jpg", "photos/Koala.jpg", "photos/Lighthouse.jpg", 
    "photos/Penguins.jpg", "photos/Tulips.jpg"
];

var Layers = (function() {
    
    var layerid = 0;
    var layers = [];
    var active = -1;
    
    return {    
        init: function() {
            Layers.container = $("#layer-tabs");
            Layers.container.on("click", ".btn", function() {
                Layers.setActive($(this).data("layerid"));
                return false;
            });
            Layers.container.on("click", ".btn em", function() {
                Layers.remove($(this).closest(".btn").data("layerid"));
                return false;
            });
        },
        add: function(img, name) {
        
            var id = layers.push(img) - 1;
            $(img).addClass("edit-img");
            
            name = name || "Image " + (id + 1);
            var btn = $('<a class="btn"  data-toggle="button"  data-layerid="'+id+'">'+name+'<em><i class="icon-remove"></i></em></a>');
            Layers.container.append(btn);
            
            
            var newLayer = $("<div class='layer' data-layerid='"+id+"'></div>");
            newLayer.append(img);
            App.imgContainer.append(newLayer);
            
            
            App.body.addClass("editing");
            return id;
        },
        setActive: function(id) {
        
            if (!layers[id]) {
                id = -1;
            }
            
            $("[data-layerid]").removeClass("active");
            $("[data-layerid="+id+"]").addClass("active");
            
            App.setEditing(id !== -1);
            
            if (active !== id) {
                ControlsView.close();
            }
            
            active = id;
            
        },
        getActive: function()  {
            return active;
        },
        remove: function(id) {
            $("[data-layerid="+id+"]").remove();
            
            layers[id] = null;
            Layers.setActive(active);
        }
    }
})();

var ControlsView = (function() {
    
    var accordion;
    
    return {
        init: function() {
        
            accordion = $("#accordion-controls");
            
            accordion.on("click", ".btn-apply", function() {
            
                if (App.activeControl) {
                    var img = $(".edit-img")[0];
                    App.activeControl.apply(img, $(this).data("action"));
                }
                
                //accordion.collapse('hide');
                
                return false;
            });
            
            accordion.on("click", ".btn-cancel", function() {
                ControlsView.close();
                return false;
            });
            
            accordion.on("click", ".btn.disabled", false);
             
            accordion.on("hide", function(e) {
                log("HIDE", App.activeControl);
                if (App.activeControl) {
                    App.activeControl.disable();
                }
                /*if (activeControl) {
                    var img = $(".edit-img")[0];
                    activeControl.cancel(img);
                }*/
                
                
                //if (activeControl) {
                //    activeControl.disable();
                //}
            });
            
            accordion.on("show", function(e) {
                
                //if (activeControl) {
                //    activeControl.disable();
                //}
                
                log("SHOW", this, e.target.id);
                App.setActiveControl(e.target.id);
                
            });
        },
        close: function() {
            accordion.find(".collapse").removeClass("in").attr("style", "");
            // accordion.collapse("hide"); opens all fields the first time for some reason
        },
        setEnabled: function(isEnabled) {
        
            accordion.find(".accordion-toggle").toggleClass("disabled", !isEnabled);
            
            if (!isEnabled) {
                ControlsView.close();
            }
        }
    };
})();

var App = {
    init: function() {
        
        if (!App.compatible()) {
            $("body").addClass("no-compat");
            return;
        }
        
        
        App.body = $("body");
        App.document = document;
        App.imgContainer = $("#app-img");
        
        Layers.init();
        ControlsView.init();
        
        var opts = {
            on: {
            	load: function(e, file) {
                    if (file.type.match(/image/)) {
                        App.loadImage(e.target.result);
                    }
            	},
            	skip: function() {
            	
            	},
            	error: function(e, file) {
            		App.body.addClass("error");
                }
            }
        };
        
        
        
        var samples= $("#sample-photos");
        samples.html(SamplePhotos.map(function(photo) {
            return "<li data-name='"+photo+"'><img src='" + photo + "' /></li>";
        }).join(''));
        
        samples.on("click", "li", function() {
            App.loadImage($(this).find("img").attr("src"));
            return false;
        });
        
        FileReaderJS.setupDrop(App.body[0], opts);
        FileReaderJS.setupInput($('#pick-file')[0], opts);
        FileReaderJS.setupClipboard(document.body, opts);
        
        
        Zoom.init();
        
        $('body').tooltip({
          selector: "a[rel=tooltip]"
        });
        
        App.loadImage(SamplePhotos[1], true)
        Layers.setActive(-1);
        
    },
    setEditing: function(isEditing) {
        
        isEditing = !!isEditing;
        
        App.body.toggleClass("editing", isEditing);
        App.isEditing = isEditing;
        ControlsView.setEnabled(isEditing);
    },
    compatible: function() {
        return !!document.createElement("canvas").getContext("2d");
    },
    setActiveControl: function(id) {
    
        if (!App.isEditing) {
            return;
        }
        
        if (id === "control-crop") {
            Controls.Crop.enable();
            App.activeControl = Controls.Crop;
        }
        else if (id === "control-rotate") {
            Controls.Rotate.enable();
            App.activeControl = Controls.Rotate;
        }
        else {
            App.activeControl = null;
        }
    },
    addNewLayer: function(img) {
        return Layers.add(img);
    },
    loadImage: function(url, loadInBackground) {
        App.body.addClass("loading");
        var img = new Image();
        img.onload = function() {
            App.body.removeClass("loading");
            var id = App.addNewLayer(img);
            if (!loadInBackground) {
                log(id);
                Layers.setActive(id);
            }
        };
        img.src = url;
    },
    getImage: function() {
        return $("#app-img");
        return $(".edit-img");
    },
    resize: function() {
    
    }
}

var Zoom = {
    _el: null,
    MAX_ZOOM: 4,
    MIN_ZOOM: .1,
    
    init: function() {
        Zoom._el = $("#zoom");
        Zoom._el.slider({
            min: Zoom.MIN_ZOOM * 100,
            max: Zoom.MAX_ZOOM * 100,
            slide: function() {
                Zoom.set(Zoom.get());
            }
        });
        
        $("#zoomFit").on("click", function() {
            Zoom.set("fit");
            return false;
        });
        /*
        Zoom._el.attr("max", Zoom.MAX_ZOOM * 100);
        Zoom._el.attr("min", Zoom.MIN_ZOOM * 100);*/
    
    },
    set: function(z) {
        var num;
        
        if (z === "fit") {
        
            $("body").addClass("fit");
            num = 1;
        }
        else {
            num = Math.min(Zoom.MAX_ZOOM, Math.max(Zoom.MIN_ZOOM, z));
            $("body").removeClass("fit");
        }
        
        // TODO: recenter scrolling content after a zoom.
        
        App.getImage().css("zoom", num);
        Zoom._el.slider("value", num * 100);
        
        App.resize();
    },
    get: function() {
        return Zoom._el.slider("value")  / 100;
    },
    reset: function() {
        Zoom.set(1);
    },
    bumpUp: function() {
        Zoom.set (Zoom.get()+ .5);
        return false;
    },
    bumpDown: function() {
        Zoom.set (Zoom.get() - .5);
        return false;
    }
}


$(App.init);