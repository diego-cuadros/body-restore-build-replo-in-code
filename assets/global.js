function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute("role", "button");
  summary.setAttribute(
    "aria-expanded",
    summary.parentNode.hasAttribute("open")
  );

  if (summary.nextElementSibling.getAttribute("id")) {
    summary.setAttribute("aria-controls", summary.nextElementSibling.id);
  }

  summary.addEventListener("click", (event) => {
    event.currentTarget.setAttribute(
      "aria-expanded",
      !event.currentTarget.closest("details").hasAttribute("open")
    );
  });

  if (summary.closest("header-drawer, menu-drawer")) return;
  summary.parentElement.addEventListener("keyup", onKeyUpEscape);
});

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== "TAB") return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener("focusout", trapFocusHandlers.focusout);
  document.addEventListener("focusin", trapFocusHandlers.focusin);

  elementToFocus.focus();

  if (
    elementToFocus.tagName === "INPUT" &&
    ["search", "text", "email", "url"].includes(elementToFocus.type) &&
    elementToFocus.value
  ) {
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch (e) {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = [
    "ARROWUP",
    "ARROWDOWN",
    "ARROWLEFT",
    "ARROWRIGHT",
    "TAB",
    "ENTER",
    "SPACE",
    "ESCAPE",
    "HOME",
    "END",
    "PAGEUP",
    "PAGEDOWN",
  ];
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener("keydown", (event) => {
    if (navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener("mousedown", (event) => {
    mouseClick = true;
  });

  window.addEventListener(
    "focus",
    () => {
      if (currentFocusedElement)
        currentFocusedElement.classList.remove("focused");

      if (mouseClick) return;

      currentFocusedElement = document.activeElement;
      currentFocusedElement.classList.add("focused");
    },
    true
  );
}

function pauseAllMedia() {
  document.querySelectorAll(".js-youtube").forEach((video) => {
    video.contentWindow.postMessage(
      '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
      "*"
    );
  });
  document.querySelectorAll(".js-vimeo").forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', "*");
  });
  document.querySelectorAll("video").forEach((video) => video.pause());
  document.querySelectorAll("product-model").forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener("focusin", trapFocusHandlers.focusin);
  document.removeEventListener("focusout", trapFocusHandlers.focusout);
  document.removeEventListener("keydown", trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== "ESCAPE") return;

  const openDetailsElement = event.target.closest("details[open]");
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector("summary");
  openDetailsElement.removeAttribute("open");
  summaryElement.setAttribute("aria-expanded", false);
  summaryElement.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector("input");
    this.changeEvent = new Event("change", { bubbles: true });
    this.input.addEventListener("change", this.onInputChange.bind(this));
    this.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this))
    );
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(
      PUB_SUB_EVENTS.quantityUpdate,
      this.validateQtyRules.bind(this)
    );
  }

  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

  onInputChange(event) {
    this.validateQtyRules();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === "plus" ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value)
      this.input.dispatchEvent(this.changeEvent);
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const min = parseInt(this.input.min);
      const buttonMinus = this.querySelector(".quantity__button[name='minus']");
      buttonMinus.classList.toggle("disabled", value <= min);
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity__button[name='plus']");
      buttonPlus.classList.toggle("disabled", value >= max);
    }
  }
}

customElements.define("quantity-input", QuantityInput);


class QuantityInputBundle extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector("input");
    this.changeEvent = new Event("change", { bubbles: true });
    this.input.addEventListener("change", this.onInputChange.bind(this));
    this.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this))
    );
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(
      PUB_SUB_EVENTS.quantityUpdate,
      this.validateQtyRules.bind(this)
    );
  }

  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

  onInputChange(event) {
    this.validateQtyRules();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === "plus" ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value)
      this.input.dispatchEvent(this.changeEvent);
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const min = parseInt(this.input.min);
      const buttonMinus = this.querySelector(".quantity__button[name='minus']");
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity__button[name='plus']");
    }
  }
}

customElements.define("quantity-input-bundle", QuantityInputBundle);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return fn(...args);
  };
}

function fetchConfig(type = "json") {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: `application/${type}`,
    },
  };
}

/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == "undefined") {
  window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent("on" + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  var method = options["method"] || "post";
  var params = options["parameters"] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for (var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (
  country_domid,
  province_domid,
  options
) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(
    options["hideElement"] || province_domid
  );

  Shopify.addListener(
    this.countryEl,
    "change",
    Shopify.bind(this.countryHandler, this)
  );

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute("data-default");
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute("data-default");
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute("data-provinces");
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = "none";
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement("option");
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement("option");
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  },
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector("details");

    this.addEventListener("keyup", this.onKeyUp.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll("summary").forEach((summary) =>
      summary.addEventListener("click", this.onSummaryClick.bind(this))
    );
    this.querySelectorAll("button:not(.localization-selector)").forEach(
      (button) =>
        button.addEventListener("click", this.onCloseButtonClick.bind(this))
    );
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    const openDetailsElement = event.target.closest("details[open]");
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(
          event,
          this.mainDetailsToggle.querySelector("summary")
        )
      : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const parentMenuElement = detailsElement.closest(".has-submenu");
    const isOpen = detailsElement.hasAttribute("open");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function addTrapFocus() {
      trapFocus(
        summaryElement.nextElementSibling,
        detailsElement.querySelector("button")
      );
      summaryElement.nextElementSibling.removeEventListener(
        "transitionend",
        addTrapFocus
      );
    }

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen
        ? this.closeMenuDrawer(event, summaryElement)
        : this.openMenuDrawer(summaryElement);

      if (window.matchMedia("(max-width: 990px)")) {
        document.documentElement.style.setProperty(
          "--viewport-height",
          `${window.innerHeight}px`
        );
      }
    } else {
      setTimeout(() => {
        detailsElement.classList.add("menu-opening");
        summaryElement.setAttribute("aria-expanded", true);
        parentMenuElement && parentMenuElement.classList.add("submenu-open");
        !reducedMotion || reducedMotion.matches
          ? addTrapFocus()
          : summaryElement.nextElementSibling.addEventListener(
              "transitionend",
              addTrapFocus
            );
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });
    summaryElement.setAttribute("aria-expanded", true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event === undefined) return;

    this.mainDetailsToggle.classList.remove("menu-opening");
    this.mainDetailsToggle.querySelectorAll("details").forEach((details) => {
      details.removeAttribute("open");
      details.classList.remove("menu-opening");
    });
    this.mainDetailsToggle
      .querySelectorAll(".submenu-open")
      .forEach((submenu) => {
        submenu.classList.remove("submenu-open");
      });
    document.body.classList.remove(
      `overflow-hidden-${this.dataset.breakpoint}`
    );
    removeTrapFocus(elementToFocus);
    this.closeAnimation(this.mainDetailsToggle);

    if (event instanceof KeyboardEvent)
      elementToFocus?.setAttribute("aria-expanded", false);
  }

  onFocusOut() {
    setTimeout(() => {
      if (
        this.mainDetailsToggle.hasAttribute("open") &&
        !this.mainDetailsToggle.contains(document.activeElement)
      )
        this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest("details");
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    const parentMenuElement = detailsElement.closest(".submenu-open");
    parentMenuElement && parentMenuElement.classList.remove("submenu-open");
    detailsElement.classList.remove("menu-opening");
    detailsElement
      .querySelector("summary")
      .setAttribute("aria-expanded", false);
    removeTrapFocus(detailsElement.querySelector("summary"));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute("open");
        if (detailsElement.closest("details[open]")) {
          trapFocus(
            detailsElement.closest("details[open]"),
            detailsElement.querySelector("summary")
          );
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define("menu-drawer", MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.querySelector(".section-header");
    this.borderOffset =
      this.borderOffset ||
      this.closest(".header-wrapper").classList.contains(
        "header-wrapper--border-bottom"
      )
        ? 1
        : 0;
    document.documentElement.style.setProperty(
      "--header-bottom-position",
      `${parseInt(
        this.header.getBoundingClientRect().bottom - this.borderOffset
      )}px`
    );
    this.header.classList.add("menu-open");

    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });

    summaryElement.setAttribute("aria-expanded", true);
    window.addEventListener("resize", this.onResize);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus) {
    if (!elementToFocus) return;
    super.closeMenuDrawer(event, elementToFocus);
    this.header.classList.remove("menu-open");
    window.removeEventListener("resize", this.onResize);
  }

  onResize = () => {
    this.header &&
      document.documentElement.style.setProperty(
        "--header-bottom-position",
        `${parseInt(
          this.header.getBoundingClientRect().bottom - this.borderOffset
        )}px`
      );
    document.documentElement.style.setProperty(
      "--viewport-height",
      `${window.innerHeight}px`
    );
  };
}

customElements.define("header-drawer", HeaderDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      "click",
      this.hide.bind(this, false)
    );
    this.addEventListener("keyup", (event) => {
      if (event.code.toUpperCase() === "ESCAPE") this.hide();
    });
    if (this.classList.contains("media-modal")) {
      this.addEventListener("pointerup", (event) => {
        if (
          event.pointerType === "mouse" &&
          !event.target.closest("deferred-media, product-model")
        )
          this.hide();
      });
    } else {
      this.addEventListener("click", (event) => {
        if (event.target === this) this.hide();
      });
    }
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector(".template-popup");
    document.body.classList.add("overflow-hidden");
    this.setAttribute("open", "");
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia();
  }

  hide() {
    document.body.classList.remove("overflow-hidden");
    document.body.dispatchEvent(new CustomEvent("modalClosed"));
    this.removeAttribute("open");
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define("modal-dialog", ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector("button");
    if (!button) return;
    button.addEventListener("click", () => {
      const modal = document.querySelector(this.getAttribute("data-modal"));
      if (modal) {
        modal.show(button);
        let id = $(this)
          .siblings("deferred-media")
          .find('.deferred-media__poster[id^="Deferred-Poster-"]')
          .attr("id");
        $('deferred-media .deferred-media__poster[id^="' + id + '"]').trigger(
          "click"
        );
      }
    });
  }
}
customElements.define("modal-opener", ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener("click", this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    window.pauseAllMedia();
    if (!this.getAttribute("loaded")) {
      const content = document.createElement("div");
      content.appendChild(
        this.querySelector("template").content.firstElementChild.cloneNode(true)
      );

      this.setAttribute("loaded", true);
      const deferredElement = this.appendChild(
        content.querySelector("video, model-viewer, iframe")
      );

      if (focus) deferredElement.focus();
      if (
        deferredElement.nodeName == "VIDEO" &&
        deferredElement.getAttribute("autoplay")
      ) {
        // force autoplay for safaris
        deferredElement.play();
      }
    }
  }
}
customElements.define("deferred-media", DeferredMedia);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.enableSliderLooping = false;
    this.currentPageElement = this.querySelector(".slider-counter--current");
    this.pageTotalElement = this.querySelector(".slider-counter--total");
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');

    if (!this.slider || !this.nextButton) return;

    this.initPages();
    const resizeObserver = new ResizeObserver((entries) => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener("scroll", this.update.bind(this));
    this.prevButton.addEventListener("click", this.onButtonClick.bind(this));
    this.nextButton.addEventListener("click", this.onButtonClick.bind(this));
  }

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter(
      (element) => element.clientWidth > 0
    );
    if (this.sliderItemsToShow.length < 2) return;
    this.sliderItemOffset =
      this.sliderItemsToShow[1].offsetLeft -
      this.sliderItemsToShow[0].offsetLeft;
    this.slidesPerPage = Math.floor(
      (this.slider.clientWidth - this.sliderItemsToShow[0].offsetLeft) /
        this.sliderItemOffset
    );
    this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    // Temporarily prevents unneeded updates resulting from variant changes
    // This should be refactored as part of https://github.com/Shopify/dawn/issues/2057
    if (!this.slider || !this.nextButton) return;

    const previousPage = this.currentPage;
    this.currentPage =
      Math.round(this.slider.scrollLeft / this.sliderItemOffset) + 1;

    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    }

    if (this.currentPage != previousPage) {
      this.dispatchEvent(
        new CustomEvent("slideChanged", {
          detail: {
            currentPage: this.currentPage,
            currentElement: this.sliderItemsToShow[this.currentPage - 1],
          },
        })
      );
    }

    if (this.enableSliderLooping) return;

    if (
      this.isSlideVisible(this.sliderItemsToShow[0]) &&
      this.slider.scrollLeft === 0
    ) {
      this.prevButton.setAttribute("disabled", "disabled");
    } else {
      this.prevButton.removeAttribute("disabled");
    }

    if (
      this.isSlideVisible(
        this.sliderItemsToShow[this.sliderItemsToShow.length - 1]
      )
    ) {
      this.nextButton.setAttribute("disabled", "disabled");
    } else {
      this.nextButton.removeAttribute("disabled");
    }
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide =
      this.slider.clientWidth + this.slider.scrollLeft - offset;
    return (
      element.offsetLeft + element.clientWidth <= lastVisibleSlide &&
      element.offsetLeft >= this.slider.scrollLeft
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const step = event.currentTarget.dataset.step || 1;
    this.slideScrollPosition =
      event.currentTarget.name === "next"
        ? this.slider.scrollLeft + step * this.sliderItemOffset
        : this.slider.scrollLeft - step * this.sliderItemOffset;
    this.setSlidePosition(this.slideScrollPosition);
  }

  setSlidePosition(position) {
    this.slider.scrollTo({
      left: position,
    });
  }
}

customElements.define("slider-component", SliderComponent);

class SlideshowComponent extends SliderComponent {
  constructor() {
    super();
    this.sliderControlWrapper = this.querySelector(".slider-buttons");
    this.enableSliderLooping = true;

    if (!this.sliderControlWrapper) return;

    this.sliderFirstItemNode = this.slider.querySelector(".slideshow__slide");
    if (this.sliderItemsToShow.length > 0) this.currentPage = 1;

    this.announcementBarSlider = this.querySelector(".announcement-bar-slider");
    // Value below should match --duration-announcement-bar CSS value
    this.announcerBarAnimationDelay = this.announcementBarSlider ? 250 : 0;

    this.sliderControlLinksArray = Array.from(
      this.sliderControlWrapper.querySelectorAll(".slider-counter__link")
    );
    this.sliderControlLinksArray.forEach((link) =>
      link.addEventListener("click", this.linkToSlide.bind(this))
    );
    this.slider.addEventListener("scroll", this.setSlideVisibility.bind(this));
    this.setSlideVisibility();

    if (this.announcementBarSlider) {
      this.announcementBarArrowButtonWasClicked = false;

      this.reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );
      this.reducedMotion.addEventListener("change", () => {
        if (this.slider.getAttribute("data-autoplay") === "true")
          this.setAutoPlay();
      });

      [this.prevButton, this.nextButton].forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            this.announcementBarArrowButtonWasClicked = true;
          },
          { once: true }
        );
      });
    }

    if (this.slider.getAttribute("data-autoplay") === "true")
      this.setAutoPlay();
  }

  setAutoPlay() {
    this.autoplaySpeed = this.slider.dataset.speed * 1000;
    this.addEventListener("mouseover", this.focusInHandling.bind(this));
    this.addEventListener("mouseleave", this.focusOutHandling.bind(this));
    this.addEventListener("focusin", this.focusInHandling.bind(this));
    this.addEventListener("focusout", this.focusOutHandling.bind(this));

    if (this.querySelector(".slideshow__autoplay")) {
      this.sliderAutoplayButton = this.querySelector(".slideshow__autoplay");
      this.sliderAutoplayButton.addEventListener(
        "click",
        this.autoPlayToggle.bind(this)
      );
      this.autoplayButtonIsSetToPlay = true;
      this.play();
    } else {
      this.reducedMotion.matches || this.announcementBarArrowButtonWasClicked
        ? this.pause()
        : this.play();
    }
  }

  onButtonClick(event) {
    super.onButtonClick(event);
    this.wasClicked = true;

    const isFirstSlide = this.currentPage === 1;
    const isLastSlide = this.currentPage === this.sliderItemsToShow.length;

    if (!isFirstSlide && !isLastSlide) {
      this.applyAnimationToAnnouncementBar(event.currentTarget.name);
      return;
    }

    if (isFirstSlide && event.currentTarget.name === "previous") {
      this.slideScrollPosition =
        this.slider.scrollLeft +
        this.sliderFirstItemNode.clientWidth * this.sliderItemsToShow.length;
    } else if (isLastSlide && event.currentTarget.name === "next") {
      this.slideScrollPosition = 0;
    }

    this.setSlidePosition(this.slideScrollPosition);

    this.applyAnimationToAnnouncementBar(event.currentTarget.name);
  }

  setSlidePosition(position) {
    if (this.setPositionTimeout) clearTimeout(this.setPositionTimeout);
    this.setPositionTimeout = setTimeout(() => {
      this.slider.scrollTo({
        left: position,
      });
    }, this.announcerBarAnimationDelay);
  }

  update() {
    super.update();
    this.sliderControlButtons = this.querySelectorAll(".slider-counter__link");
    this.prevButton.removeAttribute("disabled");

    if (!this.sliderControlButtons.length) return;

    this.sliderControlButtons.forEach((link) => {
      link.classList.remove("slider-counter__link--active");
      link.removeAttribute("aria-current");
    });
    this.sliderControlButtons[this.currentPage - 1].classList.add(
      "slider-counter__link--active"
    );
    this.sliderControlButtons[this.currentPage - 1].setAttribute(
      "aria-current",
      true
    );
  }

  autoPlayToggle() {
    this.togglePlayButtonState(this.autoplayButtonIsSetToPlay);
    this.autoplayButtonIsSetToPlay ? this.pause() : this.play();
    this.autoplayButtonIsSetToPlay = !this.autoplayButtonIsSetToPlay;
  }

  focusOutHandling(event) {
    if (this.sliderAutoplayButton) {
      const focusedOnAutoplayButton =
        event.target === this.sliderAutoplayButton ||
        this.sliderAutoplayButton.contains(event.target);
      if (!this.autoplayButtonIsSetToPlay || focusedOnAutoplayButton) return;
      this.play();
    } else if (
      !this.reducedMotion.matches &&
      !this.announcementBarArrowButtonWasClicked
    ) {
      this.play();
    }
  }

  focusInHandling(event) {
    if (this.sliderAutoplayButton) {
      const focusedOnAutoplayButton =
        event.target === this.sliderAutoplayButton ||
        this.sliderAutoplayButton.contains(event.target);
      if (focusedOnAutoplayButton && this.autoplayButtonIsSetToPlay) {
        this.play();
      } else if (this.autoplayButtonIsSetToPlay) {
        this.pause();
      }
    } else if (this.announcementBarSlider.contains(event.target)) {
      this.pause();
    }
  }

  play() {
    this.slider.setAttribute("aria-live", "off");
    clearInterval(this.autoplay);
    this.autoplay = setInterval(
      this.autoRotateSlides.bind(this),
      this.autoplaySpeed
    );
  }

  pause() {
    this.slider.setAttribute("aria-live", "polite");
    clearInterval(this.autoplay);
  }

  togglePlayButtonState(pauseAutoplay) {
    if (pauseAutoplay) {
      this.sliderAutoplayButton.classList.add("slideshow__autoplay--paused");
      this.sliderAutoplayButton.setAttribute(
        "aria-label",
        window.accessibilityStrings.playSlideshow
      );
    } else {
      this.sliderAutoplayButton.classList.remove("slideshow__autoplay--paused");
      this.sliderAutoplayButton.setAttribute(
        "aria-label",
        window.accessibilityStrings.pauseSlideshow
      );
    }
  }

  autoRotateSlides() {
    const slideScrollPosition =
      this.currentPage === this.sliderItems.length
        ? 0
        : this.slider.scrollLeft + this.sliderItemOffset;

    this.setSlidePosition(slideScrollPosition);
    this.applyAnimationToAnnouncementBar();
  }

  setSlideVisibility(event) {
    this.sliderItemsToShow.forEach((item, index) => {
      const linkElements = item.querySelectorAll("a");
      if (index === this.currentPage - 1) {
        if (linkElements.length)
          linkElements.forEach((button) => {
            button.removeAttribute("tabindex");
          });
        item.setAttribute("aria-hidden", "false");
        item.removeAttribute("tabindex");
      } else {
        if (linkElements.length)
          linkElements.forEach((button) => {
            button.setAttribute("tabindex", "-1");
          });
        item.setAttribute("aria-hidden", "true");
        item.setAttribute("tabindex", "-1");
      }
    });
    this.wasClicked = false;
  }

  applyAnimationToAnnouncementBar(button = "next") {
    if (!this.announcementBarSlider) return;

    const itemsCount = this.sliderItems.length;
    const increment = button === "next" ? 1 : -1;

    const currentIndex = this.currentPage - 1;
    let nextIndex = (currentIndex + increment) % itemsCount;
    nextIndex = nextIndex === -1 ? itemsCount - 1 : nextIndex;

    const nextSlide = this.sliderItems[nextIndex];
    const currentSlide = this.sliderItems[currentIndex];

    const animationClassIn = "announcement-bar-slider--fade-in";
    const animationClassOut = "announcement-bar-slider--fade-out";

    const isFirstSlide = currentIndex === 0;
    const isLastSlide = currentIndex === itemsCount - 1;

    const shouldMoveNext =
      (button === "next" && !isLastSlide) ||
      (button === "previous" && isFirstSlide);
    const direction = shouldMoveNext ? "next" : "previous";

    currentSlide.classList.add(`${animationClassOut}-${direction}`);
    nextSlide.classList.add(`${animationClassIn}-${direction}`);

    setTimeout(() => {
      currentSlide.classList.remove(`${animationClassOut}-${direction}`);
      nextSlide.classList.remove(`${animationClassIn}-${direction}`);
    }, this.announcerBarAnimationDelay * 2);
  }

  linkToSlide(event) {
    event.preventDefault();
    const slideScrollPosition =
      this.slider.scrollLeft +
      this.sliderFirstItemNode.clientWidth *
        (this.sliderControlLinksArray.indexOf(event.currentTarget) +
          1 -
          this.currentPage);
    this.slider.scrollTo({
      left: slideScrollPosition,
    });
  }
}

customElements.define("slideshow-component", SlideshowComponent);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("change", this.onVariantChange);
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, "", false);
    this.updatePickupAvailability();
    this.removeErrorMessage();
    this.updateVariantStatuses();

    if (!this.currentVariant) {
      this.toggleAddButton(true, "", true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.updateShareUrl();
    }
  }

  updateOptions() {
    this.options = Array.from(
      this.querySelectorAll("select"),
      (select) => select.value
    );
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    // const mediaGalleries = document.querySelectorAll(`[id^="MediaGallery-${this.dataset.section}"]`);
    // if(mediaGalleries){
    //   mediaGalleries.forEach((mediaGallery) =>
    //     mediaGallery.setActiveMedia(`${this.dataset.section}-${this.currentVariant.featured_media.id}`, true)
    //   );
    // }

    const modalContent = document.querySelector(
      `#ProductModal-${this.dataset.section} .product-media-modal__content`
    );
    if (!modalContent) return;
    const newMediaModal = modalContent.querySelector(
      `[data-media-id="${this.currentVariant.featured_media.id}"]`
    );
    modalContent.prepend(newMediaModal);
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === "false") return;
    window.history.replaceState(
      {},
      "",
      `${this.dataset.url}?variant=${this.currentVariant.id}`
    );
  }

  updateShareUrl() {
    const shareButton = document.getElementById(
      `Share-${this.dataset.section}`
    );
    if (!shareButton || !shareButton.updateUrl) return;
    shareButton.updateUrl(
      `${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`
    );
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(
      `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`
    );
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  updateVariantStatuses() {
    const selectedOptionOneVariants = this.variantData.filter(
      (variant) => this.querySelector(":checked").value === variant.option1
    );
    const inputWrappers = [...this.querySelectorAll(".product-form__input")];
    inputWrappers.forEach((option, index) => {
      if (index === 0) return;
      const optionInputs = [
        ...option.querySelectorAll('input[type="radio"], option'),
      ];
      const previousOptionSelected =
        inputWrappers[index - 1].querySelector(":checked").value;
      const availableOptionInputsValue = selectedOptionOneVariants
        .filter(
          (variant) =>
            variant.available &&
            variant[`option${index}`] === previousOptionSelected
        )
        .map((variantOption) => variantOption[`option${index + 1}`]);
      this.setInputAvailability(optionInputs, availableOptionInputsValue);
    });
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach((input) => {
      if (listOfAvailableOptions.includes(input.getAttribute("value"))) {
        input.innerText = input.getAttribute("value");
      } else {
        input.innerText = window.variantStrings.unavailable_with_option.replace(
          "[value]",
          input.getAttribute("value")
        );
      }
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector("pickup-availability");
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute("available");
      pickUpAvailability.innerHTML = "";
    }
  }

  removeErrorMessage() {
    const section = this.closest("section");
    if (!section) return;

    const productForm = section.querySelector("product-form");
    if (productForm) productForm.handleErrorMessage();
  }

  renderProductInfo() {
    const requestedVariantId = this.currentVariant.id;
    const sectionId = this.dataset.originalSection
      ? this.dataset.originalSection
      : this.dataset.section;

    fetch(
      `${this.dataset.url}?variant=${requestedVariantId}&section_id=${
        this.dataset.originalSection
          ? this.dataset.originalSection
          : this.dataset.section
      }`
    )
      .then((response) => response.text())
      .then((responseText) => {
        // prevent unnecessary ui changes from abandoned selections
        if (this.currentVariant.id !== requestedVariantId) return;

        const html = new DOMParser().parseFromString(responseText, "text/html");
        const destination = document.getElementById(
          `price-${this.dataset.section}`
        );
        const source = html.getElementById(
          `price-${
            this.dataset.originalSection
              ? this.dataset.originalSection
              : this.dataset.section
          }`
        );
        const skuSource = html.getElementById(
          `Sku-${
            this.dataset.originalSection
              ? this.dataset.originalSection
              : this.dataset.section
          }`
        );
        const skuDestination = document.getElementById(
          `Sku-${this.dataset.section}`
        );
        const inventorySource = html.getElementById(
          `Inventory-${
            this.dataset.originalSection
              ? this.dataset.originalSection
              : this.dataset.section
          }`
        );
        const inventoryDestination = document.getElementById(
          `Inventory-${this.dataset.section}`
        );

        const volumePricingSource = html.getElementById(
          `Volume-${
            this.dataset.originalSection
              ? this.dataset.originalSection
              : this.dataset.section
          }`
        );

        const pricePerItemDestination = document.getElementById(
          `Price-Per-Item-${this.dataset.section}`
        );
        const pricePerItemSource = html.getElementById(
          `Price-Per-Item-${
            this.dataset.originalSection
              ? this.dataset.originalSection
              : this.dataset.section
          }`
        );

        const volumePricingDestination = document.getElementById(
          `Volume-${this.dataset.section}`
        );

        const productFormPlanDestination = document.getElementById(
          `product-form-selling-plan`
        );

        const productFormPlanSource = html.getElementById(
          `product-form-selling-plan`
        );

        if (source && destination) destination.innerHTML = source.innerHTML;
        if (inventorySource && inventoryDestination)
          inventoryDestination.innerHTML = inventorySource.innerHTML;
        if (skuSource && skuDestination) {
          skuDestination.innerHTML = skuSource.innerHTML;
          skuDestination.classList.toggle(
            "visibility-hidden",
            skuSource.classList.contains("visibility-hidden")
          );
        }

        if (volumePricingSource && volumePricingDestination) {
          volumePricingDestination.innerHTML = volumePricingSource.innerHTML;
        }

        if (productFormPlanDestination && productFormPlanSource) {
          productFormPlanDestination.innerHTML =
            productFormPlanSource.innerHTML;
        }

        if (pricePerItemSource && pricePerItemDestination) {
          pricePerItemDestination.innerHTML = pricePerItemSource.innerHTML;
          pricePerItemDestination.classList.toggle(
            "visibility-hidden",
            pricePerItemSource.classList.contains("visibility-hidden")
          );
        }

        const price = document.getElementById(`price-${this.dataset.section}`);

        if (price) price.classList.remove("visibility-hidden");

        if (inventoryDestination)
          inventoryDestination.classList.toggle(
            "visibility-hidden",
            inventorySource.innerText === ""
          );

        const addButtonUpdated = html.getElementById(
          `ProductSubmitButton-${sectionId}`
        );
        this.toggleAddButton(
          //addButtonUpdated ? addButtonUpdated.hasAttribute('disabled') : true,
          window.variantStrings.soldOut
        );

        publish(PUB_SUB_EVENTS.variantChange, {
          data: {
            sectionId,
            html,
            variant: this.currentVariant,
          },
        });
      });
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(
      `product-form-${this.dataset.section}`
    );
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    if (!addButton) return;

    if (disable) {
      /* farther product varinat change */
      var vals = $('.product-form__input input[type="radio"]:checked').val();
      var firstChar = vals.charAt(0);
      console.log(firstChar);

      $(".bundle_product .product_data").each(function () {
        var qty = parseInt($(this).find('input[name="qty"]').val());
        console.log(qty);
        var product = qty * parseInt(firstChar);
        console.log("Product: ", product);
        $(this).find('input[name="quantity"]').val(product);
      });

      //addButton.setAttribute('disabled', 'disabled');
      if (text) addButtonText.textContent = text;
      console.log("iff");
      setTimeout(function () {
        var data_id = $(
          'product-form.product-form form input[name="id"]'
        ).val();
        var data_qty = $(
          '.select-box-prod-val option[data-id="' + data_id + '"]'
        ).attr("data-qty");
        $(".unitpriceblock span").text("$ " + data_qty + " per tablet");
      }, 200);
    } else {
      addButton.removeAttribute("disabled");
      addButtonText.textContent = window.variantStrings.addToCart;
      console.log("elsee");
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const button = document.getElementById(
      `product-form-${this.dataset.section}`
    );
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    const inventory = document.getElementById(
      `Inventory-${this.dataset.section}`
    );
    const sku = document.getElementById(`Sku-${this.dataset.section}`);
    const pricePerItem = document.getElementById(
      `Price-Per-Item-${this.dataset.section}`
    );

    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add("visibility-hidden");
    if (inventory) inventory.classList.add("visibility-hidden");
    if (sku) sku.classList.add("visibility-hidden");
    if (pricePerItem) pricePerItem.classList.add("visibility-hidden");
  }

  getVariantData() {
    this.variantData =
      this.variantData ||
      JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define("variant-selects", VariantSelects);

class VariantSelectsBox extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("change", this.onVariantChange);
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.updateVariantStatuses();

    if (!this.currentVariant) {
      // this.setUnavailable();
    } else {
      this.renderProductInfo();
      this.updateVariantInput();
    }
  }

  updateOptions() {
    this.options = Array.from(
      this.querySelectorAll("select"),
      (select) => select.value
    );
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(
      `#quick-add-${this.dataset.section}${this.dataset.productId}`
    );
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  updateVariantStatuses() {
    const selectedOptionOneVariants = this.variantData.filter(
      (variant) => this.querySelector(":checked").value === variant.option1
    );
    const inputWrappers = [...this.querySelectorAll(".product-form__input")];
    inputWrappers.forEach((option, index) => {
      if (index === 0) return;
      const optionInputs = [
        ...option.querySelectorAll('input[type="radio"], option'),
      ];
      const previousOptionSelected =
        inputWrappers[index - 1].querySelector(":checked").value;
      const availableOptionInputsValue = selectedOptionOneVariants
        .filter(
          (variant) =>
            variant.available &&
            variant[`option${index}`] === previousOptionSelected
        )
        .map((variantOption) => variantOption[`option${index + 1}`]);
      this.setInputAvailability(optionInputs, availableOptionInputsValue);
    });
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach((input) => {
      if (listOfAvailableOptions.includes(input.getAttribute("value"))) {
        input.innerText = input.getAttribute("value");
      } else {
        input.innerText = window.variantStrings.unavailable_with_option.replace(
          "[value]",
          input.getAttribute("value")
        );
      }
    });
  }

  renderProductInfo() {
    const requestedVariantId = this.currentVariant.id;
    const sectionId = this.dataset.originalSection
      ? this.dataset.originalSection
      : this.dataset.section;

    fetch(`${this.dataset.url}?variant=${requestedVariantId}`)
      .then((response) => response.text())
      .then((responseText) => {
        // prevent unnecessary ui changes from abandoned selections
        if (this.currentVariant.id !== requestedVariantId) return;

        const html = new DOMParser().parseFromString(responseText, "text/html");

        const priceContainerSource = html
          .querySelector('[id^="price-"]')
          .querySelector(".price__container");
        const priceContainerDestination =
          this.closest(".card__content").querySelector(".price__container");

        const unitPriceDestination = this.closest(
          ".card__content"
        ).querySelector(".unitpriceblock span");
        var unitPriceQty = html.querySelector(
          '.select-box-prod-val option[data-id="' + requestedVariantId + '"]'
        ).dataset.qty;

        if (priceContainerSource && priceContainerDestination)
          priceContainerDestination.innerHTML = priceContainerSource.innerHTML;

        if (unitPriceDestination && unitPriceQty)
          unitPriceDestination.innerText = `$ ${unitPriceQty}  per tablet`;

        publish(PUB_SUB_EVENTS.variantChange, {
          data: {
            sectionId,
            html,
            variant: this.currentVariant,
          },
        });
      });
  }

  getVariantData() {
    this.variantData =
      this.variantData ||
      JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define("variant-selects-box", VariantSelectsBox);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach((input) => {
      if (listOfAvailableOptions.includes(input.getAttribute("value"))) {
        input.classList.remove("disabled");
      } else {
        input.classList.add("disabled");
      }
    });
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll("fieldset"));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll("input")).find(
        (radio) => radio.checked
      ).value;
    });
  }
}

customElements.define("variant-radios", VariantRadios);

class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);

      fetch(this.dataset.url)
        .then((response) => response.text())
        .then((text) => {
          const html = document.createElement("div");
          html.innerHTML = text;
          const recommendations = html.querySelector("product-recommendations");

          if (recommendations && recommendations.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
          }

          if (
            !this.querySelector("slideshow-component") &&
            this.classList.contains("complementary-products")
          ) {
            this.remove();
          }

          if (html.querySelector(".grid__item")) {
            this.classList.add("product-recommendations--loaded");
          }
        })
        .catch((e) => {
          console.error(e);
        });
    };

    new IntersectionObserver(handleIntersection.bind(this), {
      rootMargin: "0px 0px 400px 0px",
    }).observe(this);
  }
}

customElements.define("product-recommendations", ProductRecommendations);

document.querySelectorAll(".different-tabs-buttons").forEach(function (tabs) {
  tabs.querySelectorAll(".tab-button").forEach(function (tabButton) {
    tabButton.addEventListener("click", function (button) {
      const tabKey = this.dataset.tabKey;
      const tabContent = document.getElementById(tabKey);
      const checkClass = !tabContent.classList.contains("active");
      if (checkClass) {
        tabContent
          .closest(".different-tabs-content")
          .querySelectorAll(".tab-item")
          .forEach(function (evnt) {
            console.log(evnt.classList.remove("active"));
          });
        tabContent.classList.add("active");
        this.closest(".different-tabs-buttons")
          .querySelectorAll(".tab-button")
          .forEach(function (event) {
            console.log(event.classList.remove("active"));
          });
        this.classList.add("active");
      }
    });
  });
});

document.querySelectorAll(".mega-menu__link").forEach(function (menuLink) {
  menuLink.addEventListener("mouseenter", function (event) {
    const headerMenuId = this.dataset.headerMenu;
    const headerMenuProducts = document.getElementById(headerMenuId);
    document
      .querySelectorAll(".mega-menu__product_list_grid")
      .forEach(function (menuList) {
        menuList.classList.remove("menu__product_open");
      });
    headerMenuProducts.classList.add("menu__product_open");
  });
});

// const product_slider = document.querySelector(".template-index .slider-component-product-slider");
// const productFlkty = new Flickity( product_slider, {
//   cellAlign: 'left',
//   contain: true,
//   prevNextButtons: false,
//   pageDots: false
// });

const testimonial = document.querySelector(".product_testimonials_slider");
if (testimonial) {
  var testimonialFlkty = new Flickity(testimonial, {
    cellAlign: "left",
    contain: true,
    prevNextButtons: false,
    pageDots: false,
  });

  document
    .querySelector(".testimonial_next")
    .addEventListener("click", function () {
      testimonialFlkty.next();
    });
  document
    .querySelector(".testimonial_prev")
    .addEventListener("click", function () {
      testimonialFlkty.previous();
    });
}

$(".template-index .slider-component-product-slider").slick({
  dots: false,
  arrows: false,
  infinite: false,
  speed: 300,
  slidesToShow: 5,
  slidesToScroll: 1,
  responsive: [
    {
      breakpoint: 1400,
      settings: {
        slidesToShow: 4,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      },
    },
  ],
});

$(document).ready(function () {
  $(".product-form__input input[type=radio]").change(function () {
    var taskArray = [];
    var array_string = "";
    $('input[type="radio"]:checked').each(function () {
      var changevalue = $(this).attr("data_value");
      taskArray.push(changevalue);
      array_string = taskArray.join(" / ");
    });

    $(this)
      .parents(".product__info-container")
      .find(".select__select option")
      .each(function (e) {
        variant_val = $(this).attr("data_variant");
        if (variant_val == array_string) {
          var main_vart = $(this).attr("data_cost_item");
          setTimeout(function () {
            $(".unitpriceblock").html(
              "<span>$ " + main_vart + " per tablet</span>"
            );
          }, 1000);
        }
      });
  });

  /* farther product varinat change */
  var vals = $('.product-form__input input[type="radio"]:checked').val();
  var firstChar = vals.charAt(0);
  console.log(firstChar);

  $(".bundle_product .product_data").each(function () {
    var qty = parseInt($(this).find('input[name="qty"]').val());
    console.log(qty);
    var product = qty * parseInt(firstChar);
    console.log("Product: ", product);
    $(this).find('input[name="quantity"]').val(product);
  });
});

class landingbanner extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);

      $(document).ready(function () {
        var video = $(".myVideo--" + this.getAttribute("data-sectionid"))[0];
        $(".muteBtn--" + this.getAttribute("data-sectionid"))
          .find(".mute")
          .hide();
        $(".muteBtn--" + this.getAttribute("data-sectionid"))
          .find(".unmute")
          .show();
        $(".muteBtn--" + this.getAttribute("data-sectionid")).click(
          function () {
            if (video.muted) {
              video.muted = false;
              $(".muteBtn--" + this.getAttribute("data-sectionid"))
                .find(".mute")
                .hide();
              $(".muteBtn--" + this.getAttribute("data-sectionid"))
                .find(".unmute")
                .show();
            } else {
              video.muted = true;
              $(".muteBtn--" + this.getAttribute("data-sectionid"))
                .find(".mute")
                .show();
              $(".muteBtn--" + this.getAttribute("data-sectionid"))
                .find(".unmute")
                .hide();
            }
          }
        );
      });
    };

    new IntersectionObserver(handleIntersection.bind(this), {
      rootMargin: "0px 0px 400px 0px",
    }).observe(this);
  }
}

customElements.define("landing-banner", landingbanner);

class CustomMainProduct extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);

      var galleryThumbsnew = new Swiper(
        ".custom-product-gallery-thumbnail-" +
          this.getAttribute("data-sectionid"),
        {
          spaceBetween: 8,
          slidesPerView: 4.85,
          breakpoints: {
            768: {
              slidesPerView: 4.85,
              spaceBetween: 8,
            },
            1024: {
              slidesPerView: 4.85,
              spaceBetween: 16,
            },
          },
        }
      );

      var galleryTopnew = new Swiper(
        ".custom-product-gallery-slider-" + this.getAttribute("data-sectionid"),
        {
          slidesPerView: 1,
          spaceBetween: 10,
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          breakpoints: {
            768: {
              slidesPerView: 1,
            },
            1024: {
              slidesPerView: 1,
            },
          },
          thumbs: {
            swiper: galleryThumbsnew,
          },
        }
      );

      galleryTopnew.on("slideChangeTransitionStart", function () {
        galleryThumbsnew.slideTo(galleryTopnew.activeIndex);
      });

      window.addEventListener(
        "variantchangecustom",
        function (evt) {
          galleryTopnew.slideTo(evt.detail - 1);
          console.log(evt.detail);
        },
        false
      );
    };

    new IntersectionObserver(handleIntersection.bind(this), {
      rootMargin: "0px 0px 400px 0px",
    }).observe(this);
  }
}

customElements.define("custom-main-product", CustomMainProduct);

class tabslider extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);

      var galleryThumbsnew = new Swiper(
        ".tab-content-" + this.getAttribute("data-sectionid"),
        {
          spaceBetween: 30,
          slidesPerView: "auto",
          centeredSlides: true,
          autoplay: {
            delay: 5000,
            disableOnInteraction: false,
          },
          breakpoints: {
            990: {
              centeredSlides: false,
            },
          },
        }
      );

      var galleryTopnew = new Swiper(
        ".tab-slider-" + this.getAttribute("data-sectionid"),
        {
          slidesPerView: 1,
          spaceBetween: 10,
          allowTouchMove: false,
          autoplay: {
            delay: 5000,
            disableOnInteraction: false,
          },
          effect: "fade",
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          thumbs: {
            swiper: galleryThumbsnew,
          },
        }
      );
    };

    new IntersectionObserver(handleIntersection.bind(this), {
      rootMargin: "0px 0px 400px 0px",
    }).observe(this);
  }
}

customElements.define("tab-slider", tabslider);




class ProductInfo extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);

       function totalCount() {
          var totalcount = 0;
          $(".product-bundle-product-checkbox:checked").each(function (index) {
            totalcount =
              totalcount + Number($(this).parent().find(".quantity__input").val());
          });
      
          $('.total-count-product').text(totalcount);
      
          if ($('input[name="variant_static"]:checked').val() == "1pack") {
            if (totalcount >= 100) {
              $(".flavour-atc-btn-container").removeClass("inactive");
            } else {
              $(".flavour-atc-btn-container").addClass("inactive");
            }
          }
      
          if ($('input[name="variant_static"]:checked').val() == "2pack") {
            if (totalcount >= 100) {
              $(".flavour-atc-btn-container").removeClass("inactive");
            } else {
              $(".flavour-atc-btn-container").addClass("inactive");
            }
          }
      
          if ($('input[name="variant_static"]:checked').val() == "3pack") {
            if (totalcount >= 100) {
              $(".flavour-atc-btn-container").removeClass("inactive");
            } else {
              $(".flavour-atc-btn-container").addClass("inactive");
            }
          }
      
          if ($('input[name="variant_static"]:checked').val() == "6pack") {
            if (totalcount >= 100) {
              $(".flavour-atc-btn-container").removeClass("inactive");
            } else {
              $(".flavour-atc-btn-container").addClass("inactive");
            }
          }
      
          if (totalcount >= 100) {
            $(".quantity__button-plus").css({
              "pointer-events": "none",
              opacity: "0.25",
            });
            $(".product-bundle-product-checkbox").each(function () {
              if ($(this).is(":checked")) {
              } else {
                $(this).parents(".featured-gift-container").addClass("inactive");
              }
            });
          } else {
            $(".quantity__button-plus").css({
              "pointer-events": "unset",
              opacity: "1",
            });
            $(".product-bundle-product-checkbox")
              .parents(".featured-gift-container")
              .removeClass("inactive");
          }
      
          if (totalcount >= 1 && totalcount < 2) {
            $(".product-progress-bar-container").removeClass("pack2 pack3 pack4 pack6 pack8");
            $(".product-progress-bar-container").addClass("pack1");
            $(".mbr_price_totalwrap").removeClass("disc10 dis25 dis33 dis40 dis20cb dis33cb dis40cb");
          } else if (totalcount >= 2 && totalcount < 3) {
            $(".product-progress-bar-container").removeClass("pack1 pack3 pack4 pack6 pack8");
            $(".product-progress-bar-container").addClass("pack2");
            $(".mbr_price_totalwrap").removeClass("disc10 dis25 dis33 dis40 dis20cb dis33cb dis40cb");
            $(".mbr_price_totalwrap").addClass("dis10 dis20cb");
          } else if (totalcount >= 2 && totalcount < 4) {
            $(".product-progress-bar-container").removeClass("pack2 pack1 pack4 pack6 pack8");
            $(".product-progress-bar-container").addClass("pack3");
            $(".mbr_price_totalwrap").removeClass("dis25 dis33 dis40 dis20cb dis33cb dis40cb");
            $(".mbr_price_totalwrap").addClass("dis10 dis33cb");
          } else if (totalcount >= 3 && totalcount < 6) {
            $(".product-progress-bar-container").removeClass("pack2 pack3 pack1 pack6 pack8");
            $(".product-progress-bar-container").addClass("pack4");
            $(".mbr_price_totalwrap").removeClass("dis10 dis33 dis40 dis20cb dis33cb");
            $(".mbr_price_totalwrap").addClass("dis25 dis40cb");
          } else if (totalcount >= 5 && totalcount < 8) {
            $(".product-progress-bar-container").removeClass("pack2 pack3 pack4 pack1 pack8");
            $(".product-progress-bar-container").addClass("pack6");
            $(".mbr_price_totalwrap").removeClass("dis10 dis25 dis40 dis20cb dis33cb");
            $(".mbr_price_totalwrap").addClass("dis33 dis40cb");
          } else if (totalcount >= 8) {
            $(".product-progress-bar-container").removeClass("pack2 pack3 pack4 pack6 pack1");
            $(".product-progress-bar-container").addClass("pack8");
            $(".mbr_price_totalwrap").removeClass("dis10 dis25 dis33 dis20cb dis33cb");
            $(".mbr_price_totalwrap").addClass("dis40 dis40cb");
          }
        }
      
        $(".radio-button-container label").click(function () {
          $(".radio-button-container .tab-grid").removeClass("checked-label");
          $(this).find(".tab-grid").addClass("checked-label");
          var variantCount = $(this).data("variant-count");
          $(this)
            .parent()
            .next(".main-gift-product-container")
            .find(".gift-product-container")
            .removeClass("pack6 pack3 pack2 pack1");
          $(this)
            .parent()
            .next(".main-gift-product-container")
            .find(".gift-product-container")
            .addClass(variantCount);
          $(".product-progress-bar-container").removeClass("pack6 pack3 pack2 pack1");
          $(".product-progress-bar-container").addClass(variantCount);
          $(".error-msgs").hide();
        });
      
        $(".popupbutton").click(function () {
          $(".bundle-cart-popup").show();
          $("body").addClass("body-popup-open");
          totalCount();
          $(".variantstaticmaininput:checked").click();
          var selectedbagcount = $(".variantstaticmaininput:checked").attr(
            "data-value-count"
          );
          if (selectedbagcount >= 2) {
            $(".bundle-variant-count").text(selectedbagcount + " bags");
          } else {
            $(".bundle-variant-count").text(selectedbagcount + " bag");
          }
          $(".error-msgs").hide();
        });
      
        $(".bundle-cart-popup .cross-popup").click(function () {
          $(".bundle-cart-popup").hide();
          $("body").removeClass("body-popup-open");
          $(".error-msgs").hide();
        });
      
        $(".variantstaticmaininput")
          .unbind()
          .click(function () {
            
            var currvarname = $(this).data('varname');
            $('.custom-static-variant-input').find('input[type="radio"][value="' + currvarname + '"]').trigger('click');
            
            var currvarid = $(this).data('varid');
            var currvarimage = $(this).data('image');
            
            var currbagprice = $(this).data('currbagprice');
            var onebagprice = $(this).data('onebagprice');
            var valuecount = $(this).data("value-count");
            
            var totalprice = onebagprice * valuecount;
            var discountper = Math.round(((totalprice - currbagprice) / totalprice) * 100);
            $('.totaldiscount').text(discountper+'%');
            
            $('.flavour-atc-btn-container').attr('data-bpid', currvarid);
            $('.custom-product-media-container').find('.custom-product-media img').attr('src', currvarimage);
            
            if (valuecount >= 2) {
              $(".bundle-variant-count").text(valuecount + " bags");
            } else {
              $(".bundle-variant-count").text(valuecount + " bag");
            }
            $(".error-msgs").hide();
          });
      
        $(".product-bundle-product-checkbox")
          .unbind()
          .click(function () {
            if ($(this).is(":checked")) {
              $(this)
                .parents(".featured-gift-container")
                .find(".addbuttonclick")
                .css({ display: "none" });
              $(this)
                .parents(".featured-gift-container")
                .find(".quantity-container")
                .css({ display: "flex" });
              $(this)
                .parents(".featured-gift-container")
                .find(".quantity-container").find('.quantity__input').val(1);
            } else {
              $(this)
                .parents(".featured-gift-container")
                .find(".addbuttonclick")
                .css({ display: "flex" });
              $(this)
                .parents(".featured-gift-container")
                .find(".quantity-container")
                .css({ display: "none" });
            }
            totalCount();
            $(".error-msgs").hide();
          });
      
        $(".quantity__button")
          .unbind()
          .click(function () {
            totalCount();
            var itemqty = $(this).parents('.quantity-container').find('.quantity__input').val();
             if(itemqty == 0){
                $(this)
                  .parents(".featured-gift-container")
                  .find(".product-bundle-product-checkbox")
                  .prop("checked", false);
                $(this)
                  .parents(".featured-gift-container")
                  .find(".addbuttonclick")
                  .css({ display: "flex" });
                $(this)
                  .parents(".featured-gift-container")
                  .find(".quantity-container")
                  .css({ display: "none" });
             }
             $(".error-msgs").hide();
          });
      
        $(".flavour-atc-btn-container").click(function () {
          var selectedItems = [];
          var bpid = $(this).data("bpid");
      
          $(".product-bundle-product-checkbox:checked").each(function () {
            var varid = $(this).attr("data-varid");
            var quantity = $(this)
              .parents(".featured-gift-container")
              .find(".quantity__input")
              .val();
            selectedItems.push({
              id: varid,
              quantity: parseInt(quantity),
            });
          });
      
          if (bpid) {
            // selectedItems.push({
            //   id: bpid,
            //   quantity: 1,
            // });
          }
      
          this.cart =
            document.querySelector("cart-notification") ||
            document.querySelector("cart-drawer");
          this.cart.setActiveElement(document.activeElement);
          var this2 = this;
          $.ajax({
            type: "POST",
            url: "/cart/add",
            data: {
              items: selectedItems,
              sections: this2.cart.getSectionsToRender().map((section) => section.id),
            },
            dataType: "json",
            success: function (response) {
              // $("cart-drawer").removeClass("is-empty");
              // $(".drawer__inner-empty").hide();
              // $("cart-drawer").load(location.href + " #CartDrawer");
              // $(".cart_item_clear_btn").addClass("active");
              
              $('.load-more__spinner').css({"display":"block"});
              $('.button-flavour-info').css({"opacity":"0"});
              
              setTimeout(function () {
                window.location.href = "/checkout";
                $('.load-more__spinner').css({"display":"none"});
                $('.button-flavour-info').css({"opacity":"1"});
                $(".cart_item_clear_btn").addClass("active");
                // $(".drawer").addClass("active animate");
                // $(".drawer__header").click(function (e) {
                //   e.preventDefault();
                // });
              }, 1000);
              
              // $('.bundle-cart-popup').hide();
              
              jQuery.getJSON("/cart.js", function (cart) {
                if (cart.item_count > 0) {
                  $(".header__icon .cart-count-bubble span:first-child").text(
                    cart.item_count
                  );
                }
              });
            },
            error: function (xhr, status, error) {
              var errorMessage;
              try {
                var response = JSON.parse(xhr.responseText);
                errorMessage =
                  response.description ||
                  response.message ||
                  "An unknown error occurred.";
              } catch (e) {
                errorMessage = "Error adding items to cart: " + error;
              }
              $(".error-msgs").text(errorMessage);
              $(".error-msgs").show();
            },
          });
        });
      
        var currentDate = new Date();
        var monthNames = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];

         function formatDate(date) {
            var month = monthNames[date.getMonth()];
            var day = date.getDate();
            var year = date.getFullYear();
    
            var suffix = "th";
            if (day === 1 || day === 21 || day === 31) suffix = "st";
            else if (day === 2 || day === 22) suffix = "nd";
            else if (day === 3 || day === 23) suffix = "rd";
    
            return `${month} ${day}${suffix}`;
        }
      
        function formatDateYear(date) {
            var month = monthNames[date.getMonth()];
            var day = date.getDate();
            var year = date.getFullYear();
    
            var suffix = "th";
            if (day === 1 || day === 21 || day === 31) suffix = "st";
            else if (day === 2 || day === 22) suffix = "nd";
            else if (day === 3 || day === 23) suffix = "rd";
    
            return `${month} ${day}${suffix} ${year}`;
        }
    
        var formattedCurrentDate = formatDate(currentDate);
        var formattedCurrentDateYear = formatDateYear(currentDate);
      
        var futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 3);
        var formattedFutureDate = formatDateYear(futureDate);
    
        $(".order-text-container").html(function(_, html) {
            return html.replace("$currentdata", formattedCurrentDate);
        });
    
        $(".free-gift-restock-content").text(formattedCurrentDateYear);
        $(".free-gift-time-data-sell-content").text(formattedFutureDate);

     };

    new IntersectionObserver(handleIntersection.bind(this), {
      rootMargin: "0px 0px 400px 0px",
    }).observe(this);
  }
}
customElements.define("product-info", ProductInfo);



function updateCountdown1() {
  const now = new Date();
  const target = new Date();
  target.setHours(24, 0, 0, 0);
  
  if (now >= target) {
    target.setDate(target.getDate() + 1);
  }
  
  const difference = target - now;
  const hours = Math.floor(difference / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);
  const countdownElements = document.querySelectorAll(".countdown-today");
  
  countdownElements.forEach((element) => {
    element.innerHTML = `
      <div>${hours.toString().padStart(2, "0")}
      <span>HRS</span>
      </div>:<div>${minutes.toString().padStart(2, "0")}<span>MIN</span></div>:<div>${seconds.toString().padStart(2, "0")} <span>SEC</span> </div`;
  });
  
  setTimeout(updateCountdown1, 1000);
}
updateCountdown1();

  class CustomSlider extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      const handleIntersection = (entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.unobserve(this);


        var galleryThumbs =  new Swiper(".tab-container-thumbnail-slider-"+ this.getAttribute("data-sectionid"), {
          spaceBetween: 20,
          slidesPerView: 2.5,
          breakpoints: {
            0: {
              slidesPerView: 2.5,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 3.8,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView:5,
              spaceBetween: 20,
            },
          },
        });

        var galleryTop = new Swiper(".grid-container-main-slider-"+ this.getAttribute("data-sectionid"), {
          spaceBetween: 15,
          thumbs: {
            swiper: galleryThumbs,
          },
          breakpoints: {
            0: {
              slidesPerView: 1,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 1,
              spaceBetween: 20,
            },
          },
        });

        document.addEventListener("repositionmainslider", (e) => {
          var index = e.detail.index;
          galleryTop.slideTo(index);
          galleryThumbs.slideTo(index);
        });
      };

      $(this).css({ opacity: "1" });
      

      new IntersectionObserver(handleIntersection.bind(this), {
        rootMargin: "0px 0px 400px 0px",
      }).observe(this);
    }
  }

  customElements.define("custom-banner", CustomSlider);



class BundleProductInfo extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);

       function totalCount() {
          var totalcount = 0;
          $(".product-bundle-product-checkbox:checked").each(function (index) {
            totalcount =
              totalcount + Number($(this).parent().find(".quantity__input").val());
          });
      
          $('.total-count-product').text(totalcount);

          let maxVarRange = 0;
          $('.radio-button-container label').each(function () {
            let val = parseInt($(this).data('varrange'), 10);
            if (val > maxVarRange) {
              maxVarRange = val;
            }
          });

          if ($('input[name="variant_static"]:checked').val() == "1pack") {
            if (totalcount >= 1) {
              $(".flavour-atc-btn-container").removeClass("inactive");
              $(".button-flavour-info-checkout").removeClass("inactivebtn");
              $(".button-flavour-info-select").addClass("inactivebtn");
            } else {
              $(".flavour-atc-btn-container").addClass("inactive");
              $(".button-flavour-info-checkout").addClass("inactivebtn");
              $(".button-flavour-info-select").removeClass("inactivebtn");
            }
          }
      
          if ($('input[name="variant_static"]:checked').val() == "2pack") {
            if (totalcount >= 2) {
              $(".flavour-atc-btn-container").removeClass("inactive");
              $(".button-flavour-info-checkout").removeClass("inactivebtn");
              $(".button-flavour-info-select").addClass("inactivebtn");
            } else {
              $(".flavour-atc-btn-container").addClass("inactive");
              $(".button-flavour-info-checkout").addClass("inactivebtn");
              $(".button-flavour-info-select").removeClass("inactivebtn");
            }
          }
      
          if ($('input[name="variant_static"]:checked').val() == "3pack") {
            if (totalcount >= 3) {
              $(".flavour-atc-btn-container").removeClass("inactive");
              $(".button-flavour-info-checkout").removeClass("inactivebtn");
              $(".button-flavour-info-select").addClass("inactivebtn");
            } else {
              $(".flavour-atc-btn-container").addClass("inactive");
              $(".button-flavour-info-checkout").addClass("inactivebtn");
              $(".button-flavour-info-select").removeClass("inactivebtn");
            }
          }
      
          if ($('input[name="variant_static"]:checked').val() == "4pack") {
            if (totalcount >= 4) {
              $(".flavour-atc-btn-container").removeClass("inactive");
              $(".button-flavour-info-checkout").removeClass("inactivebtn");
              $(".button-flavour-info-select").addClass("inactivebtn");
            } else {
              $(".flavour-atc-btn-container").addClass("inactive");
              $(".button-flavour-info-checkout").addClass("inactivebtn");
              $(".button-flavour-info-select").removeClass("inactivebtn");
            }
          }

          if ($('input[name="variant_static"]:checked').val() == "5pack") {
            if (totalcount >= 5) {
              $(".flavour-atc-btn-container").removeClass("inactive");
              $(".button-flavour-info-checkout").removeClass("inactivebtn");
              $(".button-flavour-info-select").addClass("inactivebtn");
            } else {
              $(".flavour-atc-btn-container").addClass("inactive");
              $(".button-flavour-info-checkout").addClass("inactivebtn");
              $(".button-flavour-info-select").removeClass("inactivebtn");
            }
          }

         if ($('input[name="variant_static"]:checked').val() == "6pack") {
            if (totalcount >= 6) {
              $(".flavour-atc-btn-container").removeClass("inactive");
              $(".button-flavour-info-checkout").removeClass("inactivebtn");
              $(".button-flavour-info-select").addClass("inactivebtn");
            } else {
              $(".flavour-atc-btn-container").addClass("inactive");
              $(".button-flavour-info-checkout").addClass("inactivebtn");     
              $(".button-flavour-info-select").removeClass("inactivebtn");
            }
          }

         if ($('input[name="variant_static"]:checked').val() == "7pack") {
            if (totalcount >= 7) {
              $(".flavour-atc-btn-container").removeClass("inactive");
              $(".button-flavour-info-checkout").removeClass("inactivebtn");
              $(".button-flavour-info-select").addClass("inactivebtn");
            } else {
              $(".flavour-atc-btn-container").addClass("inactive");
              $(".button-flavour-info-checkout").addClass("inactivebtn");
              $(".button-flavour-info-select").removeClass("inactivebtn");
            }
          }

         if ($('input[name="variant_static"]:checked').val() == "8pack") {
            if (totalcount >= 8) {
              $(".flavour-atc-btn-container").removeClass("inactive");
              $(".button-flavour-info-checkout").removeClass("inactivebtn");
              $(".button-flavour-info-select").addClass("inactivebtn");
            } else {
              $(".flavour-atc-btn-container").addClass("inactive");
              $(".button-flavour-info-checkout").addClass("inactivebtn");
              $(".button-flavour-info-select").removeClass("inactivebtn");
            }
          }
      
          if (totalcount >= maxVarRange) {
            $(".quantity__button-plus").css({
              "pointer-events": "none",
              opacity: "0.25",
            });
            $(".product-bundle-product-checkbox").each(function () {
              if ($(this).is(":checked")) {
              } else {
                $(this).parents(".featured-gift-container").addClass("inactive");
              }
            });
          } else {
            $(".quantity__button-plus").css({
              "pointer-events": "unset",
              opacity: "1",
            });
            $(".product-bundle-product-checkbox")
              .parents(".featured-gift-container")
              .removeClass("inactive");
          }
      

          var popuplabels = $('.radio-button-container label');

          var popupbestMatch = null;
          var popupbestRange = -1;
          
          popuplabels.each(function () {
            var popuprange = parseFloat($(this).attr('data-varrange'));
          
            if (popuprange <= totalcount && popuprange > popupbestRange) {
              popupbestRange = popuprange;
              popupbestMatch = $(this);
            }
          });
          
          if (popupbestMatch) {
            var popupnewClass = popupbestMatch.attr('data-varposition');
            var bundleprogressBar = $(".product-progress-bar-container");
          
            bundleprogressBar.removeClass(function (i, className) {
              return (className.match(/\bpack\d+\b/g) || []).join(" ");
            });
          
            bundleprogressBar.addClass(popupnewClass);
            var savinginfo =  $(".radio-button-container").find('label[data-varposition="' + popupnewClass + '"]').data('savinginfo');
            $('.saving-bundle-info').text(savinginfo);
           }

            var total = 0;
            var discountinfo = $(".radio-button-container").find('label[data-varposition="' + popupnewClass + '"]').data('vardiscount');
            
            $(".featured-gift-container").each(function () {
              var qty = Number($(this).find(".quantity__input").val());
              var price = Number($(this).find(".product-bundle-product-checkbox").data("price")) / 100;
              var subprice = Number($(this).find(".product-bundle-product-checkbox").data("price"));
              
              if ($(this).find(".product-bundle-product-checkbox").is(":checked") && qty > 0) {
                total += qty * price;
              }
            });
            
            var discountPercent = Number(discountinfo);
            var discountAmount = total * (discountPercent / 100);
            var finalPrice = Math.ceil(total - discountAmount);
            
            console.log("Total Price: " + total + "Final Price: "+finalPrice);
            console.log("Discount (" + discountPercent + "%): " + discountAmount);
            console.log("Final Price after Discount: " + Shopify.formatMoney(finalPrice * 100) +"=>"+ Shopify.formatMoney(total * 100));

            if (total > finalPrice) {
              $('.product-total-price').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice * 100) + '</span>'
              );
            } else {
              $('.product-total-price').html(
                '<span>' + Shopify.formatMoney(total * 100) + '</span>'
              );
            }
        }
      
        $(".radio-button-container label").click(function () {
          $(".radio-button-container .tab-grid").removeClass("checked-label");
          $(this).find(".tab-grid").addClass("checked-label");
          var variantCount = $(this).data("varposition");
          var variantsaving = $(this).data('savinginfo');
          // console.log("variantCount=="+variantCount+"variantsaving=="+variantsaving);
          $(this)
            .parent()
            .next(".main-gift-product-container")
            .find(".gift-product-container")
            .removeClass("pack4 pack3 pack2 pack1");
          $(this)
            .parent()
            .next(".main-gift-product-container")
            .find(".gift-product-container")
            .addClass(variantCount);
          $(".product-progress-bar-container").removeClass("pack4 pack3 pack2 pack1");
          $(".product-progress-bar-container").addClass(variantCount);
          $(".error-msgs").hide();
          $(".saving-bundle-info").text(variantsaving);

        });
      
        $(".popupbutton").click(function () {
          $(".bundle-cart-popup").show();
          $("body").addClass("body-popup-open");
          totalCount();
          $(".variantstaticmaininput:checked").click();
          var selectedbagcount = $(".variantstaticmaininput:checked").attr(
            "data-value-count"
          );
          if (selectedbagcount >= 2) {
            $(".bundle-variant-count").text(selectedbagcount + " bags");
          } else {
            $(".bundle-variant-count").text(selectedbagcount + " bag");
          }
          $(".error-msgs").hide();
        });
      
        $(".bundle-cart-popup .cross-popup").click(function () {
          $(".bundle-cart-popup").hide();
          $("body").removeClass("body-popup-open");
          $(".error-msgs").hide();
        });
      
        $(".variantstaticmaininput")
          .unbind()
          .click(function () {
            
            var currvarname = $(this).data('varname');
            $('.custom-static-variant-input').find('input[type="radio"][value="' + currvarname + '"]').trigger('click');
            
            var currvarid = $(this).data('varid');
            var currvarimage = $(this).data('image');
            
            var currbagprice = $(this).data('currbagprice');
            var onebagprice = $(this).data('onebagprice');
            var valuecount = $(this).data("value-count");
            var valuediscount = $(this).data("vardiscount");
            
            var totalprice = onebagprice * valuecount;
            var discountper = Math.round(((totalprice - currbagprice) / totalprice) * 100);

            console.log("valuediscount=="+valuediscount);
            
            // $('.totaldiscount').text(discountper+'%');
            
            $('.flavour-atc-btn-container').attr('data-bpid', currvarid);
            $('.custom-product-media-container').find('.custom-product-media img').attr('src', currvarimage);
             $('.selectvarcount').text(valuecount);  
            if (valuecount >= 2) {
              $(".bundle-variant-count").text(valuecount + " bags");
              $('.selectvarcountbtn').text(valuecount + " BAGS");  
            } else {
              $(".bundle-variant-count").text(valuecount + " bag");
              $('.selectvarcountbtn').text(valuecount + " BAG"); 
            }
            $(".error-msgs").hide();
          });
      
        $(".product-bundle-product-checkbox")
          .unbind()
          .click(function () {
            if ($(this).is(":checked")) {
              $(this)
                .parents(".featured-gift-container")
                .find(".addbuttonclick")
                .css({ display: "none" });
              $(this)
                .parents(".featured-gift-container")
                .find(".quantity-container")
                .css({ display: "flex" });
              $(this)
                .parents(".featured-gift-container")
                .find(".quantity-container").find('.quantity__input').val(1);
            } else {
              $(this)
                .parents(".featured-gift-container")
                .find(".addbuttonclick")
                .css({ display: "flex" });
              $(this)
                .parents(".featured-gift-container")
                .find(".quantity-container")
                .css({ display: "none" });
            }
            totalCount();
            $(".error-msgs").hide();
          });



        $(".quantity__button")
          .unbind()
          .click(function () {
            totalCount();
            var itemqty = $(this).parents('.quantity-container').find('.quantity__input').val();
            var productprice = $(this).parents('.featured-gift-container').find('.product-bundle-product-checkbox').data('price');

           if(itemqty == 0){
              $(this)
                .parents(".featured-gift-container")
                .find(".product-bundle-product-checkbox")
                .prop("checked", false);
              $(this)
                .parents(".featured-gift-container")
                .find(".addbuttonclick")
                .css({ display: "flex" });
              $(this)
                .parents(".featured-gift-container")
                .find(".quantity-container")
                .css({ display: "none" });
           }
           $(".error-msgs").hide();
        });
      
        $(".flavour-atc-btn-container").click(function () {
          var selectedItems = [];
          var bpid = $(this).data("bpid");
      
          $(".product-bundle-product-checkbox:checked").each(function () {
            var varid = $(this).attr("data-varid");
            var quantity = $(this)
              .parents(".featured-gift-container")
              .find(".quantity__input")
              .val();
            selectedItems.push({
              id: varid,
              quantity: parseInt(quantity),
            });
          });
      
          if (bpid) {
            // selectedItems.push({
            //   id: bpid,
            //   quantity: 1,
            // });
          }
      
          this.cart =
            document.querySelector("cart-notification") ||
            document.querySelector("cart-drawer");
          this.cart.setActiveElement(document.activeElement);
          var this2 = this;
          $.ajax({
            type: "POST",
            url: "/cart/add",
            data: {
              items: selectedItems,
              sections: this2.cart.getSectionsToRender().map((section) => section.id),
            },
            dataType: "json",
            success: function (response) {
              // $("cart-drawer").removeClass("is-empty");
              // $(".drawer__inner-empty").hide();
              // $("cart-drawer").load(location.href + " #CartDrawer");
              // $(".cart_item_clear_btn").addClass("active");
              
              $('.load-more__spinner').css({"display":"block"});
              $('.button-flavour-info').css({"opacity":"0"});
              
              setTimeout(function () {
                window.location.href = "/checkout";
                $('.load-more__spinner').css({"display":"none"});
                $('.button-flavour-info').css({"opacity":"1"});
                $(".cart_item_clear_btn").addClass("active");
                // $(".drawer").addClass("active animate");
                // $(".drawer__header").click(function (e) {
                //   e.preventDefault();
                // });
              }, 1000);
              
              // $('.bundle-cart-popup').hide();
              
              jQuery.getJSON("/cart.js", function (cart) {
                if (cart.item_count > 0) {
                  $(".header__icon .cart-count-bubble span:first-child").text(
                    cart.item_count
                  );
                }
              });
            },
            error: function (xhr, status, error) {
              var errorMessage;
              try {
                var response = JSON.parse(xhr.responseText);
                errorMessage =
                  response.description ||
                  response.message ||
                  "An unknown error occurred.";
              } catch (e) {
                errorMessage = "Error adding items to cart: " + error;
              }
              $(".error-msgs").text(errorMessage);
              $(".error-msgs").show();
            },
          });
        });
      
        var currentDate = new Date();
        var monthNames = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];

         function formatDate(date) {
            var month = monthNames[date.getMonth()];
            var day = date.getDate();
            var year = date.getFullYear();
    
            var suffix = "th";
            if (day === 1 || day === 21 || day === 31) suffix = "st";
            else if (day === 2 || day === 22) suffix = "nd";
            else if (day === 3 || day === 23) suffix = "rd";
    
            return `${month} ${day}${suffix}`;
        }
      
        function formatDateYear(date) {
            var month = monthNames[date.getMonth()];
            var day = date.getDate();
            var year = date.getFullYear();
    
            var suffix = "th";
            if (day === 1 || day === 21 || day === 31) suffix = "st";
            else if (day === 2 || day === 22) suffix = "nd";
            else if (day === 3 || day === 23) suffix = "rd";
    
            return `${month} ${day}${suffix} ${year}`;
        }
    
        var formattedCurrentDate = formatDate(currentDate);
        var formattedCurrentDateYear = formatDateYear(currentDate);
      
        var futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 3);
        var formattedFutureDate = formatDateYear(futureDate);
    
        $(".order-text-container").html(function(_, html) {
            return html.replace("$currentdata", formattedCurrentDate);
        });
    
        $(".free-gift-restock-content").text(formattedCurrentDateYear);
        $(".free-gift-time-data-sell-content").text(formattedFutureDate);

     };

    new IntersectionObserver(handleIntersection.bind(this), {
      rootMargin: "0px 0px 400px 0px",
    }).observe(this);
  }
}
customElements.define("bundle-product-info", BundleProductInfo);

$(document).on('click', '.quantity__button, .custom-bundle-products-details .button', function() {
            var total = 0;
            var discountinfo10 = 10;
            var discountinfo25 = 25;
            var discountinfo33 = 33;
            var discountinfo40 = 40;
            
            $(".featured-gift-container").each(function () {
              var qty = Number($(this).find(".quantity__input").val());
              var price = Number($(this).find(".product-bundle-product-checkbox").data("price")) / 100;
              var subprice = Number($(this).find(".product-bundle-product-checkbox").data("price"));
              
              if ($(this).find(".product-bundle-product-checkbox").is(":checked") && qty > 0) {
                total += qty * price;
              }
            });
            
            var discountPercent10 = Number(discountinfo10);
            var discountAmount10 = total * (discountPercent10 / 100);
            var finalPrice10 = Math.ceil(total - discountAmount10);
              $('.mbr_pricetotal10').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice10 * 100) + '</span>'
              );
              $('.totaldiscount10').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount10 * 100) + '</span>'
              );

            var discountPercent25 = Number(discountinfo25);
            var discountAmount25 = total * (discountPercent25 / 100);
            var finalPrice25 = Math.ceil(total - discountAmount25);
              $('.mbr_pricetotal25').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice25 * 100) + '</span>'
              );
              $('.totaldiscount25').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount25 * 100) + '</span>'
              );

            var discountPercent33 = Number(discountinfo33);
            var discountAmount33 = total * (discountPercent33 / 100);
            var finalPrice33 = Math.ceil(total - discountAmount33);
              $('.mbr_pricetotal33').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice33 * 100) + '</span>'
              );
              $('.totaldiscount33').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount33 * 100) + '</span>'
              );

            var discountPercent40 = Number(discountinfo40);
            var discountAmount40 = total * (discountPercent40 / 100);
            var finalPrice40 = Math.ceil(total - discountAmount40);
              $('.mbr_pricetotal40').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice40 * 100) + '</span>'
              );
              $('.totaldiscount40').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount40 * 100) + '</span>'
              );
});

$(window).scroll(function() {
            var total = 0;
            var discountinfo10 = 10;
            var discountinfo25 = 25;
            var discountinfo33 = 33;
            var discountinfo40 = 40;
            var discountinfo20cb = 20;
            var discountinfo33cb = 33;
            var discountinfo40cb = 40;
            
            $(".featured-gift-container").each(function () {
              var qty = Number($(this).find(".quantity__input").val());
              var price = Number($(this).find(".product-bundle-product-checkbox").data("price")) / 100;
              var subprice = Number($(this).find(".product-bundle-product-checkbox").data("price"));
              
              if ($(this).find(".product-bundle-product-checkbox").is(":checked") && qty > 0) {
                total += qty * price;
              }
            });
            
            var discountPercent10 = Number(discountinfo10);
            var discountAmount10 = total * (discountPercent10 / 100);
            var finalPrice10 = Math.ceil(total - discountAmount10);
              $('.mbr_pricetotal10').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice10 * 100) + '</span>'
              );
              $('.totaldiscount10').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount10 * 100) + '</span>'
              );

            var discountPercent25 = Number(discountinfo25);
            var discountAmount25 = total * (discountPercent25 / 100);
            var finalPrice25 = Math.ceil(total - discountAmount25);
              $('.mbr_pricetotal25').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice25 * 100) + '</span>'
              );
              $('.totaldiscount25').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount25 * 100) + '</span>'
              );

            var discountPercent33 = Number(discountinfo33);
            var discountAmount33 = total * (discountPercent33 / 100);
            var finalPrice33 = Math.ceil(total - discountAmount33);
              $('.mbr_pricetotal33').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice33 * 100) + '</span>'
              );
              $('.totaldiscount33').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount33 * 100) + '</span>'
              );

            var discountPercent40 = Number(discountinfo40);
            var discountAmount40 = total * (discountPercent40 / 100);
            var finalPrice40 = Math.ceil(total - discountAmount40);
              $('.mbr_pricetotal40').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice40 * 100) + '</span>'
              );
              $('.totaldiscount40').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount40 * 100) + '</span>'
              );

               var discountPercent20cb = Number(discountinfo20cb);
            var discountAmount20cb = total * (discountPercent20cb / 100);
            var finalPrice20cb = Math.ceil(total - discountAmount20cb);
              $('.mbr_pricetotal20cb').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice20cb * 100) + '</span>'
              );
              $('.totaldiscount20cb').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount20cb * 100) + '</span>'
              );

              var discountPercent33cb = Number(discountinfo33cb);
            var discountAmount33cb = total * (discountPercent33cb / 100);
            var finalPrice33cb = Math.ceil(total - discountAmount33cb);
              $('.mbr_pricetotal33cb').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice33cb * 100) + '</span>'
              );
              $('.totaldiscount33cb').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount33cb * 100) + '</span>'
              );

              var discountPercent40cb = Number(discountinfo40cb);
            var discountAmount40cb = total * (discountPercent40cb / 100);
            var finalPrice40cb = Math.ceil(total - discountAmount40cb);
              $('.mbr_pricetotal40cb').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice40cb * 100) + '</span>'
              );
              $('.totaldiscount40cb').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount40cb * 100) + '</span>'
              );
});

$(document).mousemove(function(event){
var total = 0;
            var discountinfo10 = 10;
            var discountinfo25 = 25;
            var discountinfo33 = 33;
            var discountinfo40 = 40;
            var discountinfo20cb = 20;
            var discountinfo33cb = 33;
            var discountinfo40cb = 40;
            
            $(".featured-gift-container").each(function () {
              var qty = Number($(this).find(".quantity__input").val());
              var price = Number($(this).find(".product-bundle-product-checkbox").data("price")) / 100;
              var subprice = Number($(this).find(".product-bundle-product-checkbox").data("price"));
              
              if ($(this).find(".product-bundle-product-checkbox").is(":checked") && qty > 0) {
                total += qty * price;
              }
            });
            
            var discountPercent10 = Number(discountinfo10);
            var discountAmount10 = total * (discountPercent10 / 100);
            var finalPrice10 = Math.ceil(total - discountAmount10);
              $('.mbr_pricetotal10').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice10 * 100) + '</span>'
              );
              $('.totaldiscount10').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount10 * 100) + '</span>'
              );

            var discountPercent25 = Number(discountinfo25);
            var discountAmount25 = total * (discountPercent25 / 100);
            var finalPrice25 = Math.ceil(total - discountAmount25);
              $('.mbr_pricetotal25').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice25 * 100) + '</span>'
              );
              $('.totaldiscount25').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount25 * 100) + '</span>'
              );

            var discountPercent33 = Number(discountinfo33);
            var discountAmount33 = total * (discountPercent33 / 100);
            var finalPrice33 = Math.ceil(total - discountAmount33);
              $('.mbr_pricetotal33').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice33 * 100) + '</span>'
              );
              $('.totaldiscount33').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount33 * 100) + '</span>'
              );

            var discountPercent40 = Number(discountinfo40);
            var discountAmount40 = total * (discountPercent40 / 100);
            var finalPrice40 = Math.ceil(total - discountAmount40);
              $('.mbr_pricetotal40').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice40 * 100) + '</span>'
              );
              $('.totaldiscount40').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount40 * 100) + '</span>'
              );

              var discountPercent20cb = Number(discountinfo20cb);
            var discountAmount20cb = total * (discountPercent20cb / 100);
            var finalPrice20cb = Math.ceil(total - discountAmount20cb);
              $('.mbr_pricetotal20cb').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice20cb * 100) + '</span>'
              );
              $('.totaldiscount20cb').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount20cb * 100) + '</span>'
              );

              var discountPercent33cb = Number(discountinfo33cb);
            var discountAmount33cb = total * (discountPercent33cb / 100);
            var finalPrice33cb = Math.ceil(total - discountAmount33cb);
              $('.mbr_pricetotal33cb').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice33cb * 100) + '</span>'
              );
              $('.totaldiscount33cb').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount33cb * 100) + '</span>'
              );

              var discountPercent40cb = Number(discountinfo40cb);
            var discountAmount40cb = total * (discountPercent40cb / 100);
            var finalPrice40cb = Math.ceil(total - discountAmount40cb);
              $('.mbr_pricetotal40cb').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(total * 100) + '</s><span>&nbsp;' + Shopify.formatMoney(finalPrice40cb * 100) + '</span>'
              );
              $('.totaldiscount40cb').html(
                '<s style="color:#959595;">' + Shopify.formatMoney(discountAmount40cb * 100) + '</span>'
              );
});
