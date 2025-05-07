import Hammer from "hammerjs";

class Slider {
    constructor(sliderElement, config = {}) {
        this.sliderElement = sliderElement;
        this.config = {
            isLoop: false,
            freeMode: false,
            swipeThreshold: 50,
            slideSpeed: 300,
            autoActive: false,
            clickToSlide: true,
            changeWidth: {
                enabled: false,
                widthTransitionDuration: 300,
                activeSlideWidth: null, // Custom width for active slide
            },
            lang: "auto",
            ...config,
        };

        let lang = this.config.lang;
        if (!lang || lang === "auto") {
            lang = (document.documentElement.lang || "en").toLowerCase();
        }
        this.lang = lang.toLowerCase();
        this.isGerman = this.lang.startsWith("de");
        if (!this.isGerman) this.lang = "en";

        this.sliderList = sliderElement.querySelector(".slider__list");
        if (!this.sliderList) return;
        if (!this.sliderList.id) {
            this.sliderList.id = `slider-list-${Math.floor(
                Math.random() * 10000
            )}`;
        }
        this.prevButton = sliderElement.querySelector(".slider--prev");
        this.nextButton = sliderElement.querySelector(".slider--next");
        this.paginationContainer = sliderElement.querySelector(
            ".slider__pagination"
        );
        this.slides = Array.from(this.sliderList.children).filter(
            (slide) => window.getComputedStyle(slide).display !== "none"
        );

        this.currentIndex = 0;
        this.animationId = null;
        this.isDragging = false;

        const sliderListStyles = window.getComputedStyle(this.sliderList);
        this.flexGap = parseInt(sliderListStyles.gap, 10) || 0;

        this.init();
    }

    init() {
        this.setupAccessibility();
        if (this.prevButton && this.nextButton) {
            this.setupNavigation();
        }
        if (this.paginationContainer) {
            this.setupPagination();
        }
        this.setupSwipe();
        this.setupKeyboardNavigation();
        if (this.config.clickToSlide) {
            this.setupSlideClick();
        }

        const liveRegion = document.createElement("div");
        liveRegion.setAttribute("visually-hidden", "");
        liveRegion.id = "sr-slide-status";
        liveRegion.setAttribute("aria-live", "polite");
        this.sliderElement.appendChild(liveRegion);
    }

    setupAccessibility() {
        const label = this.isGerman ? "Bildkarussell" : "Image carousel";

        this.sliderList.setAttribute("role", "region");
        this.sliderList.setAttribute("aria-label", label);
        this.sliderList.setAttribute("tabindex", "0");

        this.slides.forEach((slide, index) => {
            const isActive = index === this.currentIndex;
            const label = this.isGerman
                ? `Folie ${index + 1} von ${this.slides.length}`
                : `Slide ${index + 1} of ${this.slides.length}`;

            slide.setAttribute("role", "group");
            slide.setAttribute("aria-label", label);
            slide.setAttribute("aria-current", isActive ? "true" : "false");
            slide.classList.toggle("slide--active", isActive);
            slide.setAttribute("tabindex", isActive ? "0" : "-1");
        });
    }

    setupSlideClick() {
        this.slides.forEach((slide, index) => {
            const slideHammer = new Hammer(slide);
            slideHammer.on("tap", () => {
                if (!this.isDragging) {
                    this.moveToSlide(index);
                }
            });
        });
    }

    getTargetScrollLeft(slide, index) {
        const sliderListRect = this.sliderList.getBoundingClientRect();
        const slideRect = slide.getBoundingClientRect();
        const currentScrollLeft = this.sliderList.scrollLeft;
        const computedStyle = window.getComputedStyle(this.sliderList);
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;

        const delta = slideRect.left - sliderListRect.left;
        return currentScrollLeft + delta - paddingLeft;
    }

    moveToSlide(index) {
        const slide = this.slides[index];
        if (!slide) return;

        this.cancelMomentumAnimation();

        this.slides.forEach((s, i) => {
            const isActive = i === index;
            s.classList.toggle("slide--active", isActive);
            s.setAttribute("aria-current", isActive ? "true" : "false");
            s.setAttribute("tabindex", isActive ? "0" : "-1");
        });

        if (
            this.config.changeWidth.enabled &&
            this.config.changeWidth.activeSlideWidth
        ) {
            this.slides.forEach((slide, i) => {
                slide.style.transition = `width ${this.config.changeWidth.widthTransitionDuration}ms`;
                slide.style.width =
                    i === index ? this.config.changeWidth.activeSlideWidth : "";
            });
        }

        // Delay scroll to ensure layout reflects updated widths
        requestAnimationFrame(() => {
            const targetScrollLeft = this.getTargetScrollLeft(slide, index);
            this.smoothScrollTo(targetScrollLeft, this.config.slideSpeed);
        });

        this.currentIndex = index;
        this.updatePagination();
        this.slides[this.currentIndex].focus();

        const status = this.sliderElement.querySelector("#sr-slide-status");
        if (status) {
            const label = this.isGerman
                ? `Folie ${index + 1} von ${this.slides.length}`
                : `Slide ${index + 1} of ${this.slides.length}`;
            status.textContent = label;
        }
    }

    // [... other methods stay unchanged ...]

    destroy() {
        if (this.hammer) {
            this.hammer.destroy();
        }
    }
}

export default Slider;
