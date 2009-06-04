/**
 * @fileoverview
 * JavaScript Image Upload Preview.
 * Tested and compatible with IE6, IE7, IE8, Firefox 3.
 * 
 * @author Hedger Wang (hedgerwang@gmail.com)
 *
 */

/**
 * @constructor
 * @param {HTMLInputElement|String} input
 */
function ImageUploadPreview(input) {
  this.construct(input);
}

/**
 * Empty image that shows either for Http:// or Https://.
 * @define {String}
 */
ImageUploadPreview.BLANK_IMAGE_SRC = '//www.google.com/images/cleardot.gif';


/**
 * @define {RegExp}
 */
ImageUploadPreview.BASE64_IMG_URL_PATTERN =
/^data:image\/((png)|(gif)|(jpg)|(jpeg)|(bmp));base64/i;


/**
 * @type {HTMLInputElement}
 * @private
 */
ImageUploadPreview.prototype.input_ = null;


/**
 * @type {Function}
 * @private
 */
ImageUploadPreview.prototype.onChangeHandler_ = null;


/**
 * @type {HTMLImageElement}
 * @private
 */
ImageUploadPreview.prototype.image_ = null;


/**
 * @private
 * @type {boolean}
 */
ImageUploadPreview.prototype.isCompatible_ = null;


/**
 * @private
 * @type {Number}
 */
ImageUploadPreview.prototype.maxWidth_ = 200;


/**
 * @private
 * @type {Number}
 */
ImageUploadPreview.prototype.maxHeight_ = 200;


/**
 * @param {HTMLInputElement|String} input
 * @public
 */
ImageUploadPreview.prototype.construct = function(input) {
  if (typeof input == 'string') {
    input = document.getElementById(input);
  }

  this.input_ = input;
  this.bindEvents_();
  this.image_ = this.createImage_();
};


/**
 * @public
 */
ImageUploadPreview.prototype.dispose = function() {
  var fn = this.onChangeHandler_;
  var el = this.input_;

  if (el.addEventListener) {
    el.removeEventListener('change', fn, false);
  } else if (el.attachEvent) {
    el.detachEvent('onchange', fn);
  }

  this.onChangeHandler_ = null;
  this.input_ = null;
  this.image_ = null;
};

/**
 * @public
 */
ImageUploadPreview.prototype.preview = function() {
  var that = this;

  var onLoad = function(src) {
    // Do thing now, maybe do something later.
  };

  var onError = function(src) {
    if (!tryLoad()) {
      that.showEmptyImage_();
    }
  };

  var loadMethods = [
    this.maybeShowImageWithDataUri_,
    this.maybeShowImageByLocalPath_
  ];

  var tryLoad = function() {
    if (!loadMethods.length) {
      return false;
    }
    var fn = loadMethods.shift();
    fn.call(that, onLoad, onError);
    return true;
  };
  tryLoad();
};


/**
 * @public
 * @return {HTMLImageElement}
 */
ImageUploadPreview.prototype.getImageElement = function() {
  return this.image_;
};


/**
 * @public
 * @return {HTMLInputElement}
 */
ImageUploadPreview.prototype.getInputElement = function() {
  return this.input_;
};


/**
 * @public
 * @param {Number} maxW
 * @param {Number} maxH
 */
ImageUploadPreview.prototype.setMaxImageSize = function(maxW, maxH) {
  this.maxHeight_ = isNaN(maxH) ? 10000 : maxH;
  this.maxWidth_ = isNaN(maxW) ? 10000 : maxW;
};


/**
 * @private
 * @return {HTMLImageElement}
 */
ImageUploadPreview.prototype.createImage_ = function() {
  var doc = this.input_.document || this.input_.ownerDocument;
  var img = doc.createElement('img');
  img.src = ImageUploadPreview.BLANK_IMAGE_SRC;
  img.width = 0;
  img.height = 0;
  this.input_.parentNode.insertBefore(img, this.input_.nextSibling || null);
  return img;
};


/**
 * @private
 */
ImageUploadPreview.prototype.bindEvents_ = function() {
  var that = this;

  var fn = this.onChangeHandler_ = function(e) {
    e = e || window.event;

    if (!e.target && e.srcElement) {
      e.target = e.srcElement;
    }

    that.handleOnchange_.call(that, e);
  };

  var el = this.input_;

  if (el.addEventListener) {
    el.addEventListener('change', fn, false);
  } else if (el.attachEvent) {
    el.attachEvent('onchange', fn);
  }
};


/**
 * @param {Event} e
 * @private
 */
ImageUploadPreview.prototype.handleOnchange_ = function(e) {
  this.preview();
};


/**
 * @private
 */
ImageUploadPreview.prototype.showEmptyImage_ = function() {
  this.showImage_(ImageUploadPreview.BLANK_IMAGE_SRC, 0, 0)
};


/**
 * @private
 * @param {string} src
 * @param {number} w
 * @param {number} h
 */
ImageUploadPreview.prototype.showImage_ = function(src, w, h) {

  if (w > h) {
    if (w > this.maxWidth_) {
      h = h * this.maxWidth_ / w;
      w = this.maxWidth_;
    }
  } else {
    if (h > this.maxHeight_) {
      w = w * this.maxHeight_ / h;
      h = this.maxHeight_;
    }
  }

  var img = this.image_;
  img.src = src;

  var imgStyle = img.style;
  imgStyle.maxHeight = this.maxHeight_ + 'px';
  imgStyle.maxWidth = this.maxWidth_ + 'px';
  imgStyle.width = (w >= 0) ? Math.round(w) + 'px' : 'auto';
  imgStyle.height = (h >= 0) ? Math.round(h) + 'px' : 'auto';
};


/**
 * Note: Only Firefox 3 can do file.getAsDataURL() by 6/1/2009.
 * See {@link https://developer.mozilla.org/En/NsIDOMFile}.
 * @private
 * @param {Function?} opt_onload
 * @param {Function?} opt_onerror
 */
ImageUploadPreview.prototype.maybeShowImageWithDataUri_ =
function(opt_onload, opt_onerror) {
  var el = this.input_;
  var file = el.files && el.files[0];
  var src;

  if ((file && file.getAsDataURL) &&
      (src = file.getAsDataURL()) &&
      (ImageUploadPreview.BASE64_IMG_URL_PATTERN.test(src))) {

    var that = this;
    var img = this.image_;

    if ('naturalWidth' in this.image_) {

      this.image_.src = src;
      setTimeout(function() {
        that.showImage_(src, img.naturalWidth, img.naturalHeight);
      }, 10);

    } else {
      // Use default CSS max-width / max-height to render the size.
      that.showImage_(src, -1, -1);
    }

    if (opt_onload) {
      opt_onload.call(this, src);
    }

  } else {
    if (opt_onerror) {
      opt_onerror.call(this);
    }
  }
};


/**
 * Note: IE6 ~ IE8 can access image with local path. By 6/1/2009.
 * @private
 * @param {Function?} opt_onload
 * @param {Function?} opt_onerror
 */
ImageUploadPreview.prototype.maybeShowImageByLocalPath_ =
function(opt_onload, opt_onerror) {
  var that = this;
  var el = this.input_;
  var img = new Image();
  var timer;

  var dispose = function() {
    if (timer) {
      window.clearInterval(timer);
    }
    img.onload = null;
    img.onerror = null;
    timer = null;
    dispose = null;
    img = null;
    that = null;
    checkComplete = null;
    handleError = null;
    handleComplete = null;
  };

  var handleError = function() {
    if (opt_onerror) {
      opt_onerror.call(that);
    }
    dispose();
  };

  var handleComplete = function() {
    that.showImage_(img.src, img.width, img.height);
    if (opt_onload) {
      opt_onload.call(that, img.src);
    }
    dispose();
  };

  var checkComplete = function() {
    var type = window.event && window.event.type;

    if (type == 'error') {
      handleError();
    } else  if (img.complete || type == 'load') {
      if (!img.width || !img.height) {
        handleError();
      } else {
        handleComplete();
      }
    }
  };

  img.onload = checkComplete;
  img.onerror = checkComplete;
  timer = window.setInterval(checkComplete, 50);
  img.src = el.value;
};




